/**
 * Pipeline engine — single source of truth for every stage transition,
 * timer, extension, verification, and reversion request.
 *
 * Communicates directly with Supabase via the `db` client and invalidates
 * the query cache in React Query to update the UI.
 */
import { create } from "zustand";
import { db } from "@/lib/supabase";
import { queryClient } from "@/lib/query-client";
import { useCurrentProfile } from "./auth-store";
import {
  STAGES,
  STAGE_LABELS,
  type Stage,
  type Role,
  CRF_VALIDITY_DAYS,
  CRF_WARNING_DAYS,
  RESERVATION_VALIDITY_HOURS,
  ESCALATION_HOURS,
  UNDO_GRACE_MINUTES,
} from "@/lib/constants";
import { pipelineNow, pipelineNowIso } from "@/lib/pipeline-time";
import { notify, notifyMany } from "@/lib/notify";
import type { Database } from "@/types/supabase";

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type LeadBuyer = Database["public"]["Tables"]["lead_buyers"]["Row"];
export type StageReversionRequest = Database["public"]["Tables"]["stage_reversion_requests"]["Row"];
export type CrfExtension = Database["public"]["Tables"]["crf_extensions"]["Row"];
export type AuditEntry = Database["public"]["Tables"]["audit_trail"]["Row"];
export type AppNotification = Database["public"]["Tables"]["notifications"]["Row"];

// -------- State for UI notifications/flags --------

interface PipelineUIState {
  boardFilter: "all" | "week" | "month";
  boardConsultantFilter: string;
  showArchivedInBoard: boolean;
  setBoardFilter: (v: "all" | "week" | "month") => void;
  setBoardConsultantFilter: (v: string) => void;
  setShowArchivedInBoard: (v: boolean) => void;
}

export const usePipelineUI = create<PipelineUIState>((set) => ({
  boardFilter: "all",
  boardConsultantFilter: "",
  showArchivedInBoard: false,
  setBoardFilter: (v) => set({ boardFilter: v }),
  setBoardConsultantFilter: (v) => set({ boardConsultantFilter: v }),
  setShowArchivedInBoard: (v) => set({ showArchivedInBoard: v }),
}));

// -------- Stage-order helpers --------

const FORWARD_ORDER: Stage[] = ["new_lead", "crf", "reserved", "documentation", "closed_sale"];

function stageIndex(s: Stage): number {
  return FORWARD_ORDER.indexOf(s);
}

export function allowedStagesFor(role: Role, current: Stage): Stage[] {
  if (role === "property_consultant") {
    if (current === "cancelled" || current === "archived") return [];
    const idx = stageIndex(current);
    const forward = FORWARD_ORDER.slice(idx);
    return [...forward, "cancelled"];
  }
  return [...STAGES];
}

// -------- Required-field spec --------

export type TransitionFields = {
  crf_submission_date?: string;
  unit_description?: string;
  unit_payment_date?: string;
  unit_payment_status?: "paid" | "unpaid";
  documentation_start_date?: string;
  sale_price?: number;
  sale_payment_date?: string;
  cancellation_reason?: string;
};

export const REQUIRED_FIELDS: Record<Stage, (keyof TransitionFields)[]> = {
  new_lead: [],
  crf: ["crf_submission_date"],
  reserved: ["unit_description", "unit_payment_date", "unit_payment_status"],
  documentation: ["documentation_start_date"],
  closed_sale: ["sale_price", "sale_payment_date"],
  cancelled: ["cancellation_reason"],
  archived: [],
};

function validateFields(target: Stage, fields: TransitionFields): string | null {
  const required = REQUIRED_FIELDS[target];
  for (const k of required) {
    const v = fields[k];
    if (v == null || v === "" || (typeof v === "number" && !(v > 0))) {
      return `${k.replaceAll("_", " ")} is required.`;
    }
  }
  if (target === "cancelled" && (fields.cancellation_reason?.trim().length ?? 0) < 5) {
    return "Cancellation reason must be at least 5 characters.";
  }
  return null;
}

// -------- Database Log Helpers --------

async function logAudit(
  leadId: string,
  actorId: string,
  type: string,
  summary: string,
  meta?: any,
) {
  await db.from("audit_trail").insert({
    lead_id: leadId,
    actor_id: actorId,
    type,
    summary,
    meta: meta || null,
  });
}

// Notifications go through the central dispatcher (src/lib/notify.ts) so
// every write carries the Priority Matrix layers and a lead deep link.

// -------- Transition action --------

export type TransitionResult = { ok: true; leadId: string } | { ok: false; error: string };

interface TransitionOpts {
  auto?: boolean;
  skipUndo?: boolean;
  from?: Stage;
}

export async function transitionLead(
  leadId: string,
  toStage: Stage,
  fields: TransitionFields,
  actor: { id: string; role: Role },
  opts: TransitionOpts = {},
): Promise<TransitionResult> {
  const { data, error } = await db.rpc("transition_lead", {
    p_lead_id: leadId,
    p_to_stage: toStage,
    p_fields: fields,
    p_actor_id: actor.id,
    p_auto: opts.auto ?? false,
    p_skip_undo: opts.skipUndo ?? false,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const res = data as any;
  if (!res.ok) {
    return { ok: false, error: res.error };
  }

  queryClient.invalidateQueries({ queryKey: ["leads"] });
  queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
  return { ok: true, leadId: res.lead_id };
}

// -------- Undo --------

export function canUndoTransition(lead: Lead, actorId: string): boolean {
  if (!lead.undo_deadline || !lead.undo_actor_id) return false;
  if (lead.undo_actor_id !== actorId) return false;
  return new Date(lead.undo_deadline).getTime() > pipelineNow();
}

export async function undoTransition(leadId: string, actorId: string): Promise<TransitionResult> {
  const { data, error } = await db.rpc("undo_transition", {
    p_lead_id: leadId,
    p_actor_id: actorId,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const res = data as any;
  if (!res.ok) {
    return { ok: false, error: res.error };
  }

  queryClient.invalidateQueries({ queryKey: ["leads"] });
  queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
  return { ok: true, leadId: res.lead_id };
}

export async function lockUndoWindow(leadId: string): Promise<void> {
  await db.from("leads").update({ undo_deadline: null, undo_actor_id: null }).eq("id", leadId);
  queryClient.invalidateQueries({ queryKey: ["leads"] });
  queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
}

// -------- Extensions & Reversions --------

export async function extendCRF(
  leadId: string,
  reason: string,
  actor: { id: string; role: Role },
): Promise<{ ok: boolean; error?: string; pending?: boolean }> {
  const { data: lead, error: fetchErr } = await db
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .maybeSingle();

  if (fetchErr || !lead) return { ok: false, error: "Lead not found." };
  if (lead.stage !== "crf") return { ok: false, error: "Lead is not in CRF stage." };

  const { data: existingExtensions = [] } = await db
    .from("crf_extensions")
    .select("*")
    .eq("lead_id", leadId);

  const isFirst = existingExtensions.length === 0;

  if (isFirst && actor.role === "property_consultant") {
    const currentExpiry = lead.crf_expires_at
      ? new Date(lead.crf_expires_at).getTime()
      : pipelineNow();
    const nextExpiry = new Date(currentExpiry + CRF_VALIDITY_DAYS * 86400_000).toISOString();

    const { error: updateErr } = await db
      .from("leads")
      .update({ crf_expires_at: nextExpiry, updated_at: pipelineNowIso() })
      .eq("id", leadId);

    if (updateErr) return { ok: false, error: updateErr.message };

    await db.from("crf_extensions").insert({
      lead_id: leadId,
      actor_id: actor.id,
      reason,
      status: "auto_approved",
      resolved_by: actor.id,
      resolved_at: pipelineNowIso(),
    });

    await logAudit(leadId, actor.id, "crf_extended", "CRF extended (1st time auto-approved)");

    queryClient.invalidateQueries({ queryKey: ["leads"] });
    queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
    return { ok: true };
  }

  const { data: pendingExt } = await db
    .from("crf_extensions")
    .select("*")
    .eq("lead_id", leadId)
    .eq("status", "pending")
    .maybeSingle();

  if (pendingExt) return { ok: false, error: "A request is already pending." };

  await db.from("crf_extensions").insert({
    lead_id: leadId,
    actor_id: actor.id,
    reason,
    status: "pending",
  });

  const { data: managers = [] } = await db
    .from("profiles")
    .select("id")
    .neq("role", "property_consultant");
  await notifyMany(
    managers.map((m: { id: string }) => m.id),
    "crf_extension_requested",
    {
      title: "CRF extension requested",
      body: `${lead.full_name} — requires your approval.`,
      deep_link_path: `/leads?lead=${leadId}`,
      lead_id: leadId,
    },
  );

  queryClient.invalidateQueries({ queryKey: ["leads"] });
  queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
  return { ok: true, pending: true };
}

export async function extendReservation(
  leadId: string,
  actor: { id: string; role: Role },
): Promise<{ ok: boolean; error?: string }> {
  const { data: lead, error: fetchErr } = await db
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .maybeSingle();

  if (fetchErr || !lead) return { ok: false, error: "Lead not found." };
  if (lead.stage !== "reserved") return { ok: false, error: "Lead is not reserved." };

  const currentExpiry = lead.reservation_expires_at
    ? new Date(lead.reservation_expires_at).getTime()
    : pipelineNow();
  const nextExpiry = new Date(currentExpiry + RESERVATION_VALIDITY_HOURS * 3600_000).toISOString();

  const { error: updateErr } = await db
    .from("leads")
    .update({
      reservation_expires_at: nextExpiry,
      reservation_status: "active",
      updated_at: pipelineNowIso(),
    })
    .eq("id", leadId);

  if (updateErr) return { ok: false, error: updateErr.message };

  await logAudit(leadId, actor.id, "reservation_extended", "Extended reservation");

  queryClient.invalidateQueries({ queryKey: ["leads"] });
  queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
  return { ok: true };
}

export async function resolveCrfExtension(
  extensionId: string,
  approved: boolean,
  actor: { id: string; role: Role },
  reason?: string,
): Promise<{ ok: boolean; error?: string }> {
  if (actor.role === "property_consultant") return { ok: false, error: "Manager only." };

  const { data: ext, error: fetchErr } = await db
    .from("crf_extensions")
    .select("*")
    .eq("id", extensionId)
    .maybeSingle();

  if (fetchErr || !ext) return { ok: false, error: "Request not found." };
  if (ext.status !== "pending") return { ok: false, error: "Request already resolved." };

  const { data: lead } = await db.from("leads").select("*").eq("id", ext.lead_id).maybeSingle();
  if (!lead) return { ok: false, error: "Lead not found." };

  const nowIso = pipelineNowIso();

  if (approved) {
    const currentExpiry = lead.crf_expires_at
      ? new Date(lead.crf_expires_at).getTime()
      : pipelineNow();
    const nextExpiry = new Date(currentExpiry + CRF_VALIDITY_DAYS * 86400_000).toISOString();

    await db
      .from("leads")
      .update({ crf_expires_at: nextExpiry, updated_at: nowIso })
      .eq("id", lead.id);

    await db
      .from("crf_extensions")
      .update({ status: "approved", resolved_by: actor.id, resolved_at: nowIso })
      .eq("id", extensionId);

    await logAudit(lead.id, actor.id, "crf_extended", "CRF extension approved by manager");
    if (lead.assigned_to) {
      await notify(lead.assigned_to, "crf_extension_approved", {
        title: "CRF extension approved",
        body: `Extension for ${lead.full_name} has been approved.`,
        deep_link_path: `/leads?lead=${lead.id}`,
        lead_id: lead.id,
      });
    }
  } else {
    await db
      .from("crf_extensions")
      .update({ status: "denied", resolved_by: actor.id, resolved_at: nowIso })
      .eq("id", extensionId);

    const denyMsg = reason
      ? `CRF extension denied by manager: ${reason}`
      : "CRF extension denied by manager";
    await logAudit(lead.id, actor.id, "crf_extended_denied", denyMsg);
    if (lead.assigned_to) {
      await notify(lead.assigned_to, "crf_extension_denied", {
        title: "CRF extension denied",
        body: reason
          ? `Extension for ${lead.full_name} was denied: ${reason}`
          : `Extension for ${lead.full_name} has been denied.`,
        deep_link_path: `/leads?lead=${lead.id}`,
        lead_id: lead.id,
      });
    }
  }

  queryClient.invalidateQueries({ queryKey: ["leads"] });
  queryClient.invalidateQueries({ queryKey: ["lead", lead.id] });
  return { ok: true };
}

// -------- Buyer operations --------

export async function addBuyer(
  leadId: string,
  name: string,
  kind: LeadBuyer["kind"],
  actorId: string,
): Promise<void> {
  const { error } = await db.from("lead_buyers").insert({
    lead_id: leadId,
    name,
    kind,
    docs: { valid_id: false, valid_id_selfie: false, tin: false, account: false },
  });
  if (error) throw new Error(error.message);

  await db.from("leads").update({ last_activity_at: pipelineNowIso() }).eq("id", leadId);
  await logAudit(leadId, actorId, "buyer_added", `Added buyer: ${name} (${kind})`);

  queryClient.invalidateQueries({ queryKey: ["leads"] });
  queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
}

export async function removeBuyer(buyerId: string, actorId: string): Promise<void> {
  const { data: buyer } = await db.from("lead_buyers").select("*").eq("id", buyerId).maybeSingle();
  if (!buyer) return;

  const { error } = await db.from("lead_buyers").delete().eq("id", buyerId);
  if (error) throw new Error(error.message);

  await db.from("leads").update({ last_activity_at: pipelineNowIso() }).eq("id", buyer.lead_id);
  await logAudit(buyer.lead_id, actorId, "buyer_removed", `Removed buyer: ${buyer.name}`);

  queryClient.invalidateQueries({ queryKey: ["leads"] });
  queryClient.invalidateQueries({ queryKey: ["lead", buyer.lead_id] });
}

export async function toggleBuyerDoc(
  buyerId: string,
  doc: string,
  value: boolean,
  actorId: string,
): Promise<void> {
  const { data: buyer } = await db.from("lead_buyers").select("*").eq("id", buyerId).maybeSingle();
  if (!buyer) return;

  const docs = { ...(buyer.docs as any), [doc]: value };
  const { error } = await db.from("lead_buyers").update({ docs }).eq("id", buyerId);
  if (error) throw new Error(error.message);

  await db.from("leads").update({ last_activity_at: pipelineNowIso() }).eq("id", buyer.lead_id);
  await logAudit(
    buyer.lead_id,
    actorId,
    "buyer_doc_toggled",
    `${value ? "Checked" : "Unchecked"} ${doc.replaceAll("_", " ")} for ${buyer.name}`,
  );

  queryClient.invalidateQueries({ queryKey: ["leads"] });
  queryClient.invalidateQueries({ queryKey: ["lead", buyer.lead_id] });
}

// -------- Closed Sale Verification --------

export async function approveClosedSale(
  leadId: string,
  actor: { id: string; role: Role },
): Promise<{ ok: boolean; error?: string }> {
  if (actor.role === "property_consultant") return { ok: false, error: "Manager only." };

  const { data: lead } = await db.from("leads").select("*").eq("id", leadId).maybeSingle();
  if (!lead) return { ok: false, error: "Lead not found." };

  const nowIso = pipelineNowIso();

  const { error: updateErr } = await db
    .from("leads")
    .update({
      closed_sale_status: "verified",
      closed_sale_verified_by: actor.id,
      closed_sale_verified_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", leadId);

  if (updateErr) return { ok: false, error: updateErr.message };

  await logAudit(leadId, actor.id, "closed_sale_verified", "Closed sale verified");
  if (lead.assigned_to) {
    await notify(lead.assigned_to, "sale_verified", {
      title: "Closed sale verified!",
      body: `Your sale for ${lead.full_name} has been verified and is now Closed.`,
      deep_link_path: `/leads?lead=${leadId}`,
      lead_id: leadId,
    });
  }

  queryClient.invalidateQueries({ queryKey: ["leads"] });
  queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
  return { ok: true };
}

export async function rejectClosedSale(
  leadId: string,
  reason: string,
  actor: { id: string; role: Role },
): Promise<{ ok: boolean; error?: string }> {
  if (actor.role === "property_consultant") return { ok: false, error: "Manager only." };

  const { data: lead } = await db.from("leads").select("*").eq("id", leadId).maybeSingle();
  if (!lead) return { ok: false, error: "Lead not found." };

  const res = await transitionLead(
    leadId,
    "documentation",
    { documentation_start_date: pipelineNowIso() },
    actor,
    { auto: true },
  );

  if (!res.ok) return res;

  const nowIso = pipelineNowIso();
  await db
    .from("leads")
    .update({
      closed_sale_status: null,
      closed_sale_rejection_reason: reason,
      updated_at: nowIso,
    })
    .eq("id", leadId);

  await logAudit(leadId, actor.id, "closed_sale_rejected", `Closed sale rejected: ${reason}`);
  if (lead.assigned_to) {
    await notify(lead.assigned_to, "sale_rejected", {
      title: "Closed sale rejected",
      body: `Your sale for ${lead.full_name} was returned for review. Reason: ${reason}. Check notes.`,
      deep_link_path: `/leads?lead=${leadId}`,
      lead_id: leadId,
    });
  }

  queryClient.invalidateQueries({ queryKey: ["leads"] });
  queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
  return { ok: true };
}

// -------- Stage Reversion Requests --------

export async function requestStageReversion(
  leadId: string,
  toStage: Stage,
  reason: string,
  actor: { id: string; role: Role },
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await db.rpc("request_stage_reversion", {
    p_lead_id: leadId,
    p_to_stage: toStage,
    p_reason: reason,
    p_actor_id: actor.id,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const res = data as any;
  if (!res.ok) {
    return { ok: false, error: res.error };
  }

  queryClient.invalidateQueries({ queryKey: ["leads"] });
  queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
  return { ok: true };
}

export async function approveReversion(
  requestId: string,
  correctionReason: string,
  actor: { id: string; role: Role },
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await db.rpc("approve_reversion", {
    p_request_id: requestId,
    p_correction_reason: correctionReason,
    p_actor_id: actor.id,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const res = data as any;
  if (!res.ok) {
    return { ok: false, error: res.error };
  }

  queryClient.invalidateQueries({ queryKey: ["leads"] });
  return { ok: true };
}

export async function denyReversion(
  requestId: string,
  denyReason: string,
  actor: { id: string; role: Role },
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await db.rpc("deny_reversion", {
    p_request_id: requestId,
    p_deny_reason: denyReason,
    p_actor_id: actor.id,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const res = data as any;
  if (!res.ok) {
    return { ok: false, error: res.error };
  }

  queryClient.invalidateQueries({ queryKey: ["leads"] });
  return { ok: true };
}

// -------- Sweep expiries --------

export async function sweepExpiries(): Promise<void> {
  const { error } = await db.rpc("sweep_expiries_cron");
  if (error) {
    console.error("Failed to run expiries sweep:", error.message);
  }
  queryClient.invalidateQueries({ queryKey: ["leads"] });
}

export async function sweepStagnantLeads(): Promise<void> {
  const { error } = await db.rpc("sweep_stagnant_leads");
  if (error) {
    console.error("Failed to run stagnant leads sweep:", error.message);
  }
  queryClient.invalidateQueries({ queryKey: ["leads"] });
  queryClient.invalidateQueries({ queryKey: ["notifications"] });
}

// -------- General helpers --------

export function useActor(): { id: string; role: Role } | null {
  const profile = useCurrentProfile();
  if (!profile) return null;
  return { id: profile.id, role: profile.role as Role };
}

export function isStagnant(lead: Lead): boolean {
  if (lead.stage === "closed_sale" || lead.stage === "cancelled" || lead.stage === "archived")
    return false;
  const elapsed = pipelineNow() - new Date(lead.stage_changed_at).getTime();
  return elapsed > 7 * 86400_000;
}

export function isUrgent(lead: Lead): boolean {
  if (lead.stage === "crf" && lead.crf_expires_at) {
    const remaining = new Date(lead.crf_expires_at).getTime() - pipelineNow();
    return remaining > 0 && remaining < 3 * 86400_000;
  }
  if (lead.stage === "reserved" && lead.reservation_expires_at) {
    const remaining = new Date(lead.reservation_expires_at).getTime() - pipelineNow();
    return remaining > 0 && remaining < ESCALATION_HOURS * 3600_000;
  }
  return false;
}
