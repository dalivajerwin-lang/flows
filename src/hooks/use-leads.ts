/**
 * Leads React Query hooks.
 *
 * useLeads        — fetch leads list (role-filtered via RLS)
 * useLead         — fetch single lead with notes + buyers
 * useAddLead      — create a new lead
 * useUpdateLead   — patch any lead fields (with optimistic-lock version guard)
 * useSoftDelete   — set deleted_at (manager-only via RLS)
 * useRestoreLead  — clear deleted_at
 * useTrashedLeads — fetch leads where deleted_at is not null (manager-only)
 */
import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/supabase";
import { useRealtimeTableAllEvents } from "@/hooks/use-realtime";
import type { Database } from "@/types/supabase";

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type LeadNote = Database["public"]["Tables"]["lead_notes"]["Row"];
export type LeadBuyer = Database["public"]["Tables"]["lead_buyers"]["Row"];

export type LeadWithRelations = Lead & {
  lead_notes: LeadNote[];
  lead_buyers: LeadBuyer[];
};

// ─── Query: leads list ────────────────────────────────────────────────────────
export function useLeads(filters?: { assignedTo?: string; stage?: string }) {
  return useQuery<LeadWithRelations[]>({
    queryKey: ["leads", filters],
    queryFn: async () => {
      let q = db
        .from("leads")
        .select("*, lead_notes(*), lead_buyers(*)")
        .is("deleted_at", null)
        .order("last_activity_at", { ascending: false });
      if (filters?.assignedTo) q = q.eq("assigned_to", filters.assignedTo);
      if (filters?.stage) q = q.eq("stage", filters.stage);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return data as LeadWithRelations[];
    },
  });
}

// ─── Query: single lead ───────────────────────────────────────────────────────
export function useLead(id: string | null) {
  return useQuery<LeadWithRelations | null>({
    queryKey: ["lead", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await db
        .from("leads")
        .select("*, lead_notes(*), lead_buyers(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as LeadWithRelations | null;
    },
  });
}

// ─── Query: trashed leads (manager-only, RLS enforced) ───────────────────────
export function useTrashedLeads() {
  return useQuery<Lead[]>({
    queryKey: ["leads", "trashed"],
    queryFn: async () => {
      const { data, error } = await db
        .from("leads")
        .select("*")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data as Lead[];
    },
  });
}

// ─── Realtime: cross-client leads sync ───────────────────────────────────────
/**
 * Invalidates lead queries on any leads-table change made by ANOTHER session
 * (trash/restore/purge from admin, reassignment, stage moves…). Without this,
 * a manager kept seeing a lead the admin had already deleted until a full
 * reload — mutations only invalidate the acting user's own cache.
 * Mount once (AppShell). Requires the leads table in the supabase_realtime
 * publication (migration 022); RLS still scopes which rows each user receives.
 */
export function useRealtimeLeads(enabled = true) {
  const qc = useQueryClient();
  const onChange = useCallback(
    (payload: { eventType: string; new: Record<string, unknown> }) => {
      // Prefix match covers ["leads", filters], ["leads", "trashed"], ["leads", "deleted"].
      qc.invalidateQueries({ queryKey: ["leads"] });
      const id = (payload.new as { id?: string })?.id;
      if (id) qc.invalidateQueries({ queryKey: ["lead", id] });
    },
    [qc],
  );
  useRealtimeTableAllEvents("leads", undefined, onChange, enabled);
}

// ─── Mutation: add lead ───────────────────────────────────────────────────────
export function useAddLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Lead, "id" | "created_at" | "updated_at" | "version">) => {
      const { data, error } = await db
        .from("leads")
        .insert({ ...payload, version: 1 })
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as Lead;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

// ─── Mutation: update lead (with optimistic-lock version guard) ───────────────
export class ConflictError extends Error {
  constructor(public leadId: string) {
    super(`Conflict on lead ${leadId} — version mismatch`);
    this.name = "ConflictError";
  }
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
      currentVersion,
    }: {
      id: string;
      patch: Partial<Lead>;
      currentVersion?: number;
    }) => {
      const now = new Date().toISOString();
      let q = db
        .from("leads")
        .update({
          ...patch,
          updated_at: now,
          last_activity_at: now,
          ...(currentVersion !== undefined ? { version: currentVersion + 1 } : {}),
        })
        .eq("id", id);

      // Optimistic lock: only update if version still matches
      if (currentVersion !== undefined) {
        q = q.eq("version", currentVersion);
      }

      const { data, error } = await q.select().maybeSingle();
      if (error) throw new Error(error.message);

      // Version mismatch — another actor updated the lead concurrently
      if (!data && currentVersion !== undefined) {
        throw new ConflictError(id);
      }

      return data as Lead;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      if (data?.id)
        qc.setQueryData(["lead", data.id], (old: LeadWithRelations | null) =>
          old ? { ...old, ...data } : data,
        );
    },
  });
}

// ─── Mutation: soft-delete lead ───────────────────────────────────────────────
export function useSoftDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from("leads")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

// ─── Mutation: restore lead from trash ───────────────────────────────────────
export function useRestoreLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await db
        .from("leads")
        .update({ deleted_at: null, reactivated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as Lead;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

// ─── Mutation: add note to lead ───────────────────────────────────────────────
export function useAddLeadNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      leadId,
      authorId,
      body,
      isInternal,
    }: {
      leadId: string;
      authorId: string;
      body: string;
      isInternal: boolean;
    }) => {
      const { data, error } = await db
        .from("lead_notes")
        .insert({ lead_id: leadId, author_id: authorId, body, is_internal: isInternal })
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message);
      // Also bump the lead's last_activity_at
      await db
        .from("leads")
        .update({ last_activity_at: new Date().toISOString() })
        .eq("id", leadId);
      return data as LeadNote;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["lead", vars.leadId] });
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

// ─── Mutation: add buyer to lead ─────────────────────────────────────────────
export function useAddLeadBuyer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<LeadBuyer, "id" | "created_at">) => {
      const { data, error } = await db.from("lead_buyers").insert(payload).select().maybeSingle();
      if (error) throw new Error(error.message);
      return data as LeadBuyer;
    },
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ["lead", vars.lead_id] }),
  });
}

// ─── Mutation: update buyer docs ─────────────────────────────────────────────
export function useUpdateBuyerDocs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      buyerId,
      leadId,
      docs,
    }: {
      buyerId: string;
      leadId: string;
      docs: Record<string, boolean>;
    }) => {
      const { error } = await db.from("lead_buyers").update({ docs }).eq("id", buyerId);
      if (error) throw new Error(error.message);
      return { buyerId, leadId };
    },
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ["lead", vars.leadId] }),
  });
}
