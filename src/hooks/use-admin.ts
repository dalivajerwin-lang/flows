import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db, supabase } from "@/lib/supabase";

/**
 * Superadmin console operations. Every mutation here goes through an
 * audited SECURITY DEFINER RPC (migration 016) or the admin-user-ops
 * edge function — never a raw table update — so the audit trail is
 * written in the same transaction as the change.
 */

function invalidateAdmin(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["profiles"] });
  qc.invalidateQueries({ queryKey: ["audit_trail"] });
  qc.invalidateQueries({ queryKey: ["admin_health"] });
}

export function useAdminSetRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { targetId: string; newRole: "manager" | "property_consultant" }) => {
      const { error } = await db.rpc("admin_set_role", {
        p_target_id: args.targetId,
        p_new_role: args.newRole,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => invalidateAdmin(qc),
  });
}

export function useAdminSetActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { targetId: string; active: boolean }) => {
      const { error } = await db.rpc("admin_set_active", {
        p_target_id: args.targetId,
        p_active: args.active,
      });
      if (error) throw new Error(error.message);
      // Deactivation also kicks the user out of any live sessions.
      if (!args.active) {
        await invokeUserOp({ action: "revoke_sessions", target_id: args.targetId }).catch(() => {});
      }
    },
    onSuccess: () => invalidateAdmin(qc),
  });
}

export function useAdminRevokeToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tokenId: string) => {
      const { error } = await db.rpc("admin_revoke_token", { p_token_id: tokenId });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["registration_tokens"] });
      qc.invalidateQueries({ queryKey: ["audit_trail"] });
    },
  });
}

export function useAdminReassignLeads() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { fromUser: string; toUser: string; leadIds?: string[] }) => {
      const { data, error } = await db.rpc("admin_reassign_leads", {
        p_from_user: args.fromUser,
        p_to_user: args.toUser,
        p_lead_ids: args.leadIds ?? null,
      });
      if (error) throw new Error(error.message);
      return data as number;
    },
    onSuccess: () => {
      invalidateAdmin(qc);
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useAdminForceStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { leadId: string; toStage: string; reason: string }) => {
      const { error } = await db.rpc("admin_force_stage", {
        p_lead_id: args.leadId,
        p_to_stage: args.toStage,
        p_reason: args.reason,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      invalidateAdmin(qc);
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useAdminRestoreLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await db.rpc("admin_restore_lead", { p_lead_id: leadId });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      invalidateAdmin(qc);
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useAdminPurgeTrash() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await db.rpc("admin_purge_trash");
      if (error) throw new Error(error.message);
      return data as number;
    },
    onSuccess: () => {
      invalidateAdmin(qc);
      // Prefix match also covers ["leads", "deleted"] (the trash panel).
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

// --- admin-user-ops edge function (service-role operations) ---

type UserOpAction = "revoke_sessions" | "send_reset" | "delete_user";

async function invokeUserOp(body: { action: UserOpAction; target_id: string }) {
  const { data, error } = await supabase.functions.invoke<{ message?: string; error?: string }>(
    "admin-user-ops",
    { body },
  );
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data?.message ?? "Done.";
}

export function useAdminUserOp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: invokeUserOp,
    onSuccess: () => invalidateAdmin(qc),
  });
}

// --- health snapshot (Phase 4 dashboard) ---

export interface HealthSnapshot {
  critical_events_24h: number;
  failed_logins_24h: number;
  stuck_reversions: number;
  stuck_crf_extensions: number;
  orphaned_leads: number;
  stale_users: number;
  registration_locked: boolean;
  active_users_today: number;
  leads_touched_today: number;
  deleted_leads: number;
  generated_at: string;
}

export function useHealthSnapshot() {
  return useQuery<HealthSnapshot>({
    queryKey: ["admin_health"],
    queryFn: async () => {
      const { data, error } = await db.rpc("admin_health_snapshot");
      if (error) throw new Error(error.message);
      return data as unknown as HealthSnapshot;
    },
    refetchInterval: 60_000,
  });
}
