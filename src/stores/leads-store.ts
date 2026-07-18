import { create } from "zustand";
import { supabase, db } from "@/lib/supabase";
import { queryClient } from "@/lib/query-client";
import { useLeads, useTrashedLeads, type LeadWithRelations } from "@/hooks/use-leads";
import { useProfiles } from "@/hooks/use-profiles";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./auth-store";
import { normalizePhone } from "@/lib/phone";
import { extractFacebookCanonicalId } from "@/lib/facebook";
import { uploadAndGetSignedUrl } from "@/lib/storage-helper";
import type { LeadSource, UnitType } from "@/lib/lead-sources";
import type { Stage } from "@/lib/constants";
import type { Database } from "@/types/supabase";
import { notify, notifyMany } from "@/lib/notify";

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type LeadNote = Database["public"]["Tables"]["lead_notes"]["Row"];
export type AuditEntry = Database["public"]["Tables"]["audit_trail"]["Row"];
export type AuditEntryType = string;

const SORT_KEY = "tenacious.leads.sort.v1";

export type SortKey = "updated_desc" | "created_desc" | "name_asc" | "stage";

export interface LeadCreateInput {
  full_name: string;
  contact_number: string; // raw
  source: LeadSource;
  source_other_description?: string | null;
  project_id: string;
  unit_types: UnitType[];
  date_added: string; // ISO
  assigned_to: string; // user id or "" for unassigned
}

export type DuplicateResult =
  | { ok: true; leadId: string }
  | { ok: false; block: true; reason: "phone" | "facebook" }
  | { ok: false; warn: true; reason: "name_project"; existingId: string };

interface LeadsUIState {
  search: string;
  stageChips: Set<Stage | "trash" | "all">;
  consultantFilter: string; // "" = all, "unassigned", or a user id
  sortKey: SortKey;
  visibleCount: number;
  setSearch: (v: string) => void;
  toggleStageChip: (v: Stage | "all" | "trash") => void;
  setStageChip: (v: Stage | "all" | "trash") => void;
  setConsultantFilter: (v: string) => void;
  setSortKey: (v: SortKey) => void;
  setVisibleCount: (n: number) => void;
  clearFilters: () => void;
}

export const useLeadsUI = create<LeadsUIState>((set, get) => ({
  search: "",
  stageChips: new Set<Stage | "trash" | "all">(["all"]),
  consultantFilter: "",
  sortKey:
    typeof window !== "undefined"
      ? ((window.localStorage.getItem(SORT_KEY) as SortKey) ?? "updated_desc")
      : "updated_desc",
  visibleCount: 20,
  setSearch: (v) => set({ search: v, visibleCount: 20 }),
  toggleStageChip: (v) => {
    const cur = new Set(get().stageChips);
    if (v === "all") {
      set({ stageChips: new Set(["all"]), visibleCount: 20 });
      return;
    }
    cur.delete("all");
    if (cur.has(v)) cur.delete(v);
    else cur.add(v);
    if (cur.size === 0) cur.add("all");
    set({ stageChips: cur, visibleCount: 20 });
  },
  setStageChip: (v) => set({ stageChips: new Set([v]), visibleCount: 20 }),
  setConsultantFilter: (v) => set({ consultantFilter: v, visibleCount: 20 }),
  setSortKey: (v) => {
    if (typeof window !== "undefined") window.localStorage.setItem(SORT_KEY, v);
    set({ sortKey: v, visibleCount: 20 });
  },
  setVisibleCount: (n) => set({ visibleCount: n }),
  clearFilters: () =>
    set({
      search: "",
      stageChips: new Set<Stage | "trash" | "all">(["all"]),
      consultantFilter: "",
      visibleCount: 20,
    }),
}));

// -------- Duplicate detection helpers --------

async function checkPhoneDuplicate(normalized: string, excludeId?: string): Promise<Lead | null> {
  if (!normalized) return null;
  let q = db.from("leads").select("*").is("deleted_at", null).eq("contact_number", normalized);
  if (excludeId) q = q.neq("id", excludeId);
  const { data } = await q.maybeSingle();
  return data as Lead | null;
}

async function checkFacebookDuplicate(
  canonicalId: string,
  excludeId?: string,
): Promise<Lead | null> {
  if (!canonicalId) return null;
  let q = db
    .from("leads")
    .select("*")
    .is("deleted_at", null)
    .eq("facebook_canonical_id", canonicalId);
  if (excludeId) q = q.neq("id", excludeId);
  const { data } = await q.maybeSingle();
  return data as Lead | null;
}

async function checkNameProjectDuplicate(
  name: string,
  projectId: string,
  excludeId?: string,
): Promise<Lead | null> {
  const n = name.trim().toLowerCase();
  let q = db.from("leads").select("*").is("deleted_at", null).eq("project_id", projectId);
  if (excludeId) q = q.neq("id", excludeId);
  const { data } = await q;
  if (!data) return null;
  return (data as Lead[]).find((l) => l.full_name.trim().toLowerCase() === n) ?? null;
}

// -------- Selectors (hooks) --------

export interface VisibleLeadsResult {
  leads: Lead[];
  /** True while the underlying leads query has not yet produced data. */
  isLoading: boolean;
  /** True when the fetch failed — show an error state, NOT an empty CRM. */
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useVisibleLeads(opts: { includeTrash?: boolean } = {}): VisibleLeadsResult {
  const userId = useAuth((s) => s.userId);
  const { data: profiles = [] } = useProfiles();
  const me = profiles.find((p) => p.id === userId) ?? null;

  // For consultants, pass their ID as a DB-level filter so the query itself
  // only fetches their own leads. This is defense-in-depth on top of RLS.
  const isConsultant = me?.role === "property_consultant";
  const assignedToFilter = isConsultant && me ? me.id : undefined;

  const activeQuery = useLeads(assignedToFilter ? { assignedTo: assignedToFilter } : undefined);

  // Always subscribe to trashed leads so the hook call count stays constant
  // (React rules — hooks must never be called conditionally).
  const trashedQuery = useTrashedLeads();

  const query = opts.includeTrash ? trashedQuery : activeQuery;
  const status = {
    isLoading: query.isLoading,
    isError: query.isError,
    error: (query.error as Error) ?? null,
    refetch: () => query.refetch(),
  };

  if (!me) return { leads: [], ...status };

  if (!opts.includeTrash) {
    const leads = activeQuery.data ?? [];
    return { leads: leads.filter((l) => l.deleted_at == null), ...status };
  } else {
    // Trash view: managers/superadmins see all trashed leads (RLS enforced).
    // Consultants see only their own trashed leads.
    const trashedLeads = trashedQuery.data ?? [];
    return {
      leads:
        isConsultant && me ? trashedLeads.filter((l) => l.assigned_to === me.id) : trashedLeads,
      ...status,
    };
  }
}

export function useLead(id: string | undefined | null): LeadWithRelations | null {
  const userId = useAuth((s) => s.userId);
  const { data: profiles = [] } = useProfiles();
  const me = profiles.find((p) => p.id === userId) ?? null;

  const { data: rawLead } = useQuery<LeadWithRelations | null>({
    queryKey: ["lead", id],
    enabled: !!id && !!me,
    // staleTime: 0 — always re-fetch after invalidation so stage transitions
    // are reflected immediately without needing to close/reopen the panel.
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await db
        .from("leads")
        .select("*, lead_notes(*), lead_buyers(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as LeadWithRelations | null;
    },
    initialData: () => {
      if (!id) return undefined;
      const queries = queryClient.getQueriesData<LeadWithRelations[]>({ queryKey: ["leads"] });
      for (const [_, data] of queries) {
        if (Array.isArray(data)) {
          const found = data.find((l) => l.id === id);
          if (found) return found;
        }
      }
      return undefined;
    },
    initialDataUpdatedAt: () => {
      return queryClient.getQueryState(["leads"])?.dataUpdatedAt;
    },
  });

  if (!id || !me || !rawLead) return null;
  // Return null for consultants looking at another agent's lead (access guard).
  // Callers that need to detect "exists but no access" vs "not found" should
  // read the raw query cache directly via queryClient.
  if (me.role === "property_consultant" && rawLead.assigned_to !== me.id) return null;
  return rawLead;
}

export function useLeadAudit(leadId: string | null | undefined): AuditEntry[] {
  // Audit trail is usually read directly from the lead's audit trail query or table.
  // In Phase 3, we can load it from a query. Let's create an query for audit trail
  const { data: audit = [] } = useQuery<AuditEntry[]>({
    queryKey: ["audit_trail", leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const { data, error } = await db
        .from("audit_trail")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data as AuditEntry[];
    },
  });
  return audit;
}

// -------- Mutations (Direct Supabase interactions) --------

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

export async function createLead(
  input: LeadCreateInput,
  opts: { force?: boolean } = {},
): Promise<DuplicateResult> {
  const auth = useAuth.getState();
  if (!auth.userId || !auth.profile) return { ok: false, block: true, reason: "phone" };
  const me = auth.profile;

  const normalized = normalizePhone(input.contact_number || "");
  const phoneDup = await checkPhoneDuplicate(normalized);
  if (phoneDup) return { ok: false, block: true, reason: "phone" };

  const nameDup = await checkNameProjectDuplicate(input.full_name, input.project_id);
  if (nameDup && !opts.force) {
    return { ok: false, warn: true, reason: "name_project", existingId: nameDup.id };
  }

  const assignedTo = me.role === "property_consultant" ? me.id : input.assigned_to;

  const newLead = {
    full_name: input.full_name.trim(),
    contact_number: normalized,
    email: null,
    stage: "new_lead",
    previous_stage: null,
    assigned_to: assignedTo || null,
    project_id: input.project_id || null,
    source: input.source,
    source_other_description:
      input.source === "other" ? (input.source_other_description ?? null)?.trim() || null : null,
    unit_types: input.unit_types,
    date_added: input.date_added,
    facebook_url: null,
    facebook_canonical_id: null,
    profile_photo_url: null,
    sale_price: null,
    deleted_at: null,
    reactivated_at: null,
    version: 1,
  };

  const { data, error } = await db.from("leads").insert(newLead).select().maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const leadId = data.id;
  await logAudit(leadId, me.id, "lead_created", `Created lead ${newLead.full_name}`);

  // Blueprint notification triggers for new leads.
  if (assignedTo && assignedTo !== me.id) {
    // A manager assigned the lead to a consultant on creation.
    await notify(assignedTo, "new_lead_assigned", {
      title: "New lead assigned",
      body: `A new lead, ${newLead.full_name}, has been assigned to you.`,
      deep_link_path: `/leads?lead=${leadId}`,
      lead_id: leadId,
    });
  } else if (!assignedTo) {
    // Unassigned lead — alert all managers to assign it.
    const { data: managers = [] } = await db
      .from("profiles")
      .select("id")
      .neq("role", "property_consultant");
    await notifyMany(
      (managers as { id: string }[]).map((m) => m.id),
      "new_unassigned_lead",
      {
        title: "New unassigned lead",
        body: "A new unassigned lead has arrived. Assign it from the All Leads section.",
        deep_link_path: `/leads?lead=${leadId}`,
        lead_id: leadId,
      },
    );
  }

  queryClient.invalidateQueries({ queryKey: ["leads"] });
  return { ok: true, leadId };
}

export async function updateLead(
  id: string,
  patch: Partial<
    Pick<
      Lead,
      | "full_name"
      | "contact_number"
      | "project_id"
      | "unit_types"
      | "source"
      | "source_other_description"
      | "date_added"
      | "email"
    >
  >,
): Promise<{ ok: true } | { ok: false; block: true; reason: "phone" }> {
  const auth = useAuth.getState();
  if (!auth.userId || !auth.profile) return { ok: false, block: true, reason: "phone" };
  const me = auth.profile;

  // Retrieve current lead to implement optimistic locking check
  const { data: currentLead, error: fetchErr } = await db
    .from("leads")
    .select("version, contact_number")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !currentLead) {
    throw new Error("Lead not found or fetch failed");
  }

  const nextPatch = { ...patch } as any;
  if (patch.contact_number != null) {
    const normalized = normalizePhone(patch.contact_number);
    const dup = await checkPhoneDuplicate(normalized, id);
    if (dup) return { ok: false, block: true, reason: "phone" };
    nextPatch.contact_number = normalized;
  }

  const baseVersion = (currentLead.version as number) ?? 1;
  const now = new Date().toISOString();

  const { data: updatedData, error: updateErr } = await db
    .from("leads")
    .update({
      ...nextPatch,
      updated_at: now,
      last_activity_at: now,
      version: baseVersion + 1,
    })
    .eq("id", id)
    .eq("version", baseVersion)
    .select()
    .maybeSingle();

  if (updateErr) {
    throw new Error(updateErr.message);
  }

  // Version check failed (optimistic lock conflict)
  if (!updatedData) {
    throw new Error("ConflictError");
  }

  const changedKeys = Object.keys(patch);
  await logAudit(id, me.id, "lead_updated", `Updated ${changedKeys.join(", ")}`, {
    keys: changedKeys,
  });

  queryClient.invalidateQueries({ queryKey: ["leads"] });
  queryClient.invalidateQueries({ queryKey: ["lead", id] });
  return { ok: true };
}

export async function reassignLead(
  id: string,
  newAssignee: string,
): Promise<{ ok: boolean; error?: string }> {
  const auth = useAuth.getState();
  if (!auth.userId || !auth.profile) return { ok: false, error: "Not authenticated" };
  const me = auth.profile;
  if (me.role === "property_consultant") return { ok: false, error: "Manager only" };

  const { data: lead, error: fetchErr } = await db
    .from("leads")
    .select("assigned_to, full_name")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr || !lead) return { ok: false, error: "Lead not found" };

  const prev = lead.assigned_to;
  const { error: updateErr } = await db
    .from("leads")
    .update({
      assigned_to: newAssignee || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateErr) return { ok: false, error: updateErr.message };

  await logAudit(id, me.id, "ownership_transfer", "Reassigned lead", {
    from: prev,
    to: newAssignee,
  });

  // Blueprint triggers: new owner gets an assignment notice, previous owner
  // is told the lead was transferred away.
  if (newAssignee && newAssignee !== prev) {
    await notify(newAssignee, "new_lead_assigned", {
      title: "New lead assigned",
      body: `A new lead, ${lead.full_name}, has been assigned to you.`,
      deep_link_path: `/leads?lead=${id}`,
      lead_id: id,
    });
  }
  if (prev && prev !== newAssignee) {
    await notify(prev, "lead_transferred_away", {
      title: "Lead transferred",
      body: `${lead.full_name} has been transferred to another consultant.`,
      deep_link_path: "/leads",
      lead_id: id,
    });
  }

  queryClient.invalidateQueries({ queryKey: ["leads"] });
  queryClient.invalidateQueries({ queryKey: ["lead", id] });
  return { ok: true };
}

export async function addNote(
  id: string,
  body: string,
  isInternal: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const auth = useAuth.getState();
  if (!auth.userId || !auth.profile) return { ok: false, error: "Not authenticated" };
  const me = auth.profile;
  if (isInternal && me.role === "property_consultant") {
    return { ok: false, error: "Consultants cannot mark notes as internal" };
  }

  const { data: note, error: noteErr } = await db
    .from("lead_notes")
    .insert({
      lead_id: id,
      author_id: me.id,
      body: body.trim().slice(0, 1000),
      is_internal: isInternal,
    })
    .select()
    .maybeSingle();

  if (noteErr) return { ok: false, error: noteErr.message };

  // Bump lead last activity
  await db
    .from("leads")
    .update({ last_activity_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id);

  await logAudit(id, me.id, "note_added", isInternal ? "Added internal note" : "Added note");

  queryClient.invalidateQueries({ queryKey: ["leads"] });
  queryClient.invalidateQueries({ queryKey: ["lead", id] });
  return { ok: true };
}

export async function setLeadPhoto(id: string, photo: File | string | null): Promise<void> {
  const auth = useAuth.getState();
  if (!auth.userId || !auth.profile) return;
  const me = auth.profile;

  let finalUrl: string | null = null;
  if (photo instanceof File) {
    finalUrl = await uploadAndGetSignedUrl("profile-photos", "leads", photo);
  } else {
    finalUrl = photo;
  }

  const { error } = await db
    .from("leads")
    .update({
      profile_photo_url: finalUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await logAudit(
    id,
    me.id,
    "photo_updated",
    finalUrl ? "Updated profile photo" : "Removed profile photo",
  );

  queryClient.invalidateQueries({ queryKey: ["leads"] });
  queryClient.invalidateQueries({ queryKey: ["lead", id] });
}

export async function setLeadFacebook(
  id: string,
  url: string | null,
): Promise<{ ok: true } | { ok: false; block: true; reason: "facebook" }> {
  const auth = useAuth.getState();
  if (!auth.userId || !auth.profile) return { ok: false, block: true, reason: "facebook" };
  const me = auth.profile;

  const canonical = extractFacebookCanonicalId(url ?? "");
  if (canonical) {
    const dup = await checkFacebookDuplicate(canonical, id);
    if (dup) return { ok: false, block: true, reason: "facebook" };
  }

  const { error } = await db
    .from("leads")
    .update({
      facebook_url: url,
      facebook_canonical_id: canonical,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await logAudit(
    id,
    me.id,
    "facebook_updated",
    url ? "Updated Facebook link" : "Removed Facebook link",
  );

  queryClient.invalidateQueries({ queryKey: ["leads"] });
  queryClient.invalidateQueries({ queryKey: ["lead", id] });
  return { ok: true };
}

export async function trashLead(id: string): Promise<{ ok: boolean; error?: string }> {
  const auth = useAuth.getState();
  if (!auth.userId || !auth.profile) return { ok: false, error: "Not authenticated" };
  const me = auth.profile;
  if (me.role === "property_consultant") return { ok: false, error: "Manager only" };

  const { error } = await db
    .from("leads")
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  await logAudit(id, me.id, "lead_trashed", "Moved to trash");

  queryClient.invalidateQueries({ queryKey: ["leads"] });
  queryClient.invalidateQueries({ queryKey: ["leads", "trashed"] });
  queryClient.invalidateQueries({ queryKey: ["lead", id] });
  return { ok: true };
}

export async function restoreLead(
  id: string,
): Promise<{ ok: true } | { ok: false; conflict: true } | { ok: false; error: string }> {
  const auth = useAuth.getState();
  if (!auth.userId || !auth.profile) return { ok: false, error: "Not authenticated" };
  const me = auth.profile;
  if (me.role === "property_consultant") return { ok: false, error: "Manager only" };

  const { data: lead, error: fetchErr } = await db
    .from("leads")
    .select("contact_number, facebook_canonical_id")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr || !lead) return { ok: false, error: "Lead not found" };

  if (lead.contact_number) {
    const dup = await checkPhoneDuplicate(lead.contact_number, id);
    if (dup) return { ok: false, conflict: true };
  }
  if (lead.facebook_canonical_id) {
    const dup = await checkFacebookDuplicate(lead.facebook_canonical_id, id);
    if (dup) return { ok: false, conflict: true };
  }

  const { error: updateErr } = await db
    .from("leads")
    .update({
      deleted_at: null,
      reactivated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateErr) return { ok: false, error: updateErr.message };

  await logAudit(id, me.id, "lead_restored", "Restored from trash");

  queryClient.invalidateQueries({ queryKey: ["leads"] });
  queryClient.invalidateQueries({ queryKey: ["leads", "trashed"] });
  queryClient.invalidateQueries({ queryKey: ["lead", id] });
  return { ok: true };
}

export async function reactivateLead(id: string): Promise<{ ok: boolean; error?: string }> {
  const auth = useAuth.getState();
  if (!auth.userId || !auth.profile) return { ok: false, error: "Not authenticated" };
  const me = auth.profile;

  const { data: lead, error: fetchErr } = await db
    .from("leads")
    .select("stage")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr || !lead) return { ok: false, error: "Lead not found" };
  if (lead.stage !== "cancelled" && lead.stage !== "archived") {
    return { ok: false, error: "Only cancelled/archived leads can be reactivated" };
  }

  const { error: updateErr } = await db
    .from("leads")
    .update({
      stage: "new_lead",
      stage_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reactivated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateErr) return { ok: false, error: updateErr.message };

  await logAudit(id, me.id, "lead_reactivated", "Reactivated lead");

  queryClient.invalidateQueries({ queryKey: ["leads"] });
  queryClient.invalidateQueries({ queryKey: ["lead", id] });
  return { ok: true };
}

// -------- Filtering / sorting --------

function stageMatchesFilter(lead: Lead, chips: Set<Stage | "all" | "trash">): boolean {
  // "All" shows every non-deleted, non-archived lead.
  // Archived leads are intentionally hidden from the default view —
  // they only surface when the user explicitly selects the "Archived" chip.
  if (chips.has("all")) return lead.deleted_at == null && lead.stage !== "archived";
  if (chips.has("trash")) return lead.deleted_at != null;
  if (lead.deleted_at != null) return false;
  return chips.has(lead.stage as Stage);
}

export function filterAndSortLeads(
  leads: Lead[],
  ui: Pick<LeadsUIState, "search" | "stageChips" | "consultantFilter" | "sortKey">,
  projectsById: Record<string, string>,
  stageLabels: Record<string, string>,
): Lead[] {
  const q = ui.search.trim().toLowerCase();
  const chips = ui.stageChips;
  const isTrashView = chips.has("trash");
  const out = leads.filter((l) => {
    if (!stageMatchesFilter(l, chips)) return false;
    if (ui.consultantFilter) {
      if (
        ui.consultantFilter === "unassigned" ? l.assigned_to : l.assigned_to !== ui.consultantFilter
      )
        return false;
    }
    if (q.length >= 2) {
      const projectName = (projectsById[l.project_id || ""] ?? "").toLowerCase();
      const stageLabel = (stageLabels[l.stage] ?? "").toLowerCase();
      const hay = [
        l.full_name,
        l.contact_number,
        projectName,
        l.source,
        stageLabel,
        l.date_added.slice(0, 10),
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  void isTrashView;

  const cmp: Record<SortKey, (a: Lead, b: Lead) => number> = {
    updated_desc: (a, b) =>
      a.updated_at < b.updated_at
        ? 1
        : a.updated_at > b.updated_at
          ? -1
          : a.created_at < b.created_at
            ? 1
            : -1,
    created_desc: (a, b) => (a.created_at < b.created_at ? 1 : -1),
    name_asc: (a, b) => a.full_name.localeCompare(b.full_name),
    stage: (a, b) => a.stage.localeCompare(b.stage),
  };
  return out.sort(cmp[ui.sortKey]);
}

export function useFilterableLeads(includeTrash = false): Lead[] {
  const { leads } = useVisibleLeads({ includeTrash });
  return leads;
}
