import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type ReversionRequest = Database["public"]["Tables"]["stage_reversion_requests"]["Row"];
type CrfExtension = Database["public"]["Tables"]["crf_extensions"]["Row"];

/** Trashed leads (RLS: manager/superadmin via leads_trash_manager). */
export function useDeletedLeads() {
  return useQuery({
    queryKey: ["leads", "deleted"],
    queryFn: async () => {
      const { data, error } = await db
        .from("leads")
        .select("id, full_name, stage, deleted_at, assigned_to")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data as Pick<Lead, "id" | "full_name" | "stage" | "deleted_at" | "assigned_to">[];
    },
  });
}

/** Open (non-deleted) leads assigned to one user, for reassignment preview. */
export function useLeadsAssignedTo(userId: string | null) {
  return useQuery({
    queryKey: ["leads", "assigned_to", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await db
        .from("leads")
        .select("id, full_name, stage")
        .eq("assigned_to", userId!)
        .is("deleted_at", null)
        .order("full_name");
      if (error) throw new Error(error.message);
      return data as Pick<Lead, "id" | "full_name" | "stage">[];
    },
  });
}

/** All pending approvals (reversions + CRF extensions), oldest first. */
export function usePendingApprovals() {
  return useQuery({
    queryKey: ["admin_pending_approvals"],
    queryFn: async () => {
      const [reversions, extensions] = await Promise.all([
        db
          .from("stage_reversion_requests")
          .select("*, lead:leads(full_name), agent:profiles!stage_reversion_requests_agent_id_fkey(display_name)")
          .eq("status", "pending")
          .order("created_at", { ascending: true }),
        db
          .from("crf_extensions")
          .select("*, lead:leads(full_name), actor:profiles!crf_extensions_actor_id_fkey(display_name)")
          .eq("status", "pending")
          .order("requested_at", { ascending: true }),
      ]);
      if (reversions.error) throw new Error(reversions.error.message);
      if (extensions.error) throw new Error(extensions.error.message);
      return {
        reversions: reversions.data as (ReversionRequest & {
          lead: { full_name: string } | null;
          agent: { display_name: string } | null;
        })[],
        extensions: extensions.data as (CrfExtension & {
          lead: { full_name: string } | null;
          actor: { display_name: string } | null;
        })[],
      };
    },
  });
}
