/**
 * useDashboardData — shared hook that fetches all data needed by the dashboard.
 * Used by the main Dashboard component and its internal sub-components.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLeads } from "@/hooks/use-leads";
import { useAllProfiles } from "@/hooks/use-profiles";
import { useAppointments } from "@/hooks/use-appointments";
import { useCurrentProfile } from "@/stores/auth-store";
import { db as supabase } from "@/lib/supabase";
import type { DBShape } from "@/lib/dashboard-selectors";

export function useDashboardData() {
  const profile = useCurrentProfile();
  // Consultants only see their own leads; managers/admins see all (enforced by RLS + explicit filter)
  const isConsultant = profile?.role === "property_consultant";
  const leadsFilter = isConsultant && profile ? { assignedTo: profile.id } : undefined;
  const { data: leads = [], isLoading: leadsLoading } = useLeads(leadsFilter);
  const { data: profiles = [], isLoading: profilesLoading } = useAllProfiles();
  const { data: appointments = [], isLoading: apptsLoading } = useAppointments();

  const { data: auditTrail = [], isLoading: auditLoading } = useQuery({
    queryKey: ["audit_trail"],
    queryFn: async () => {
      const { data, error } = await supabase.from("audit_trail").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: crfExtensions = [], isLoading: crfExtLoading } = useQuery({
    queryKey: ["crf_extensions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crf_extensions").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: teamGoals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ["team_goals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("team_goals").select("*");
      if (error) throw error;
      return data;
    },
  });

  const isLoading =
    leadsLoading ||
    profilesLoading ||
    apptsLoading ||
    auditLoading ||
    crfExtLoading ||
    goalsLoading;

  const dbData: DBShape = {
    leads,
    profiles,
    appointments,
    audit_trail: auditTrail,
    crf_extensions: crfExtensions,
    team_goals: teamGoals,
  };

  return { db: dbData, isLoading };
}

// ─── Upsert Team Goal ──────────────────────────────────────────────────────────
export function useUpsertTeamGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ month, amount }: { month: string; amount: number }) => {
      // upsert by month (unique key)
      const { data, error } = await supabase
        .from("team_goals")
        .upsert({ month, target_amount: amount }, { onConflict: "month" })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team_goals"] });
    },
  });
}

// ─── Update Personal Monthly Target ───────────────────────────────────────────
export function useUpdatePersonalTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update({ personal_monthly_target: amount, updated_at: new Date().toISOString() })
        .eq("id", userId)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profiles"] });
    },
  });
}
