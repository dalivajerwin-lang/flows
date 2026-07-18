import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLeads } from "@/hooks/use-leads";
import { useAllProfiles } from "@/hooks/use-profiles";
import { useAppointments } from "@/hooks/use-appointments";
import { db } from "@/lib/supabase";
import { useAuth, type Profile } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { SalesRevenueReport } from "./sales-revenue-report";
import { TrendReport } from "./trend-report";
import { SourceRoiReport } from "./source-roi-report";
import { ActivityVolumeReport } from "./activity-volume-report";
import { SmartExportModal } from "./smart-export-modal";

export function ReportsPage() {
  const [exportOpen, setExportOpen] = useState(false);
  const profile = useAuth((s: { profile: Profile | null }) => s.profile);

  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: profiles = [], isLoading: profilesLoading } = useAllProfiles();
  const { data: appointments = [], isLoading: apptsLoading } = useAppointments();

  const { data: auditTrail = [], isLoading: auditLoading } = useQuery({
    queryKey: ["audit_trail"],
    queryFn: async () => {
      const { data, error } = await db.from("audit_trail").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: teamGoals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ["team_goals"],
    queryFn: async () => {
      const { data, error } = await db.from("team_goals").select("*");
      if (error) throw error;
      return data;
    },
  });

  if (leadsLoading || profilesLoading || apptsLoading || auditLoading || goalsLoading) {
    return (
      <div className="text-center py-12 text-sm text-[var(--color-text-secondary)]">
        Loading report metrics...
      </div>
    );
  }

  const isConsultant = profile?.role === "property_consultant";

  // For consultants, scope the data to their own records only.
  const scopedLeads = isConsultant ? leads.filter((l) => l.assigned_to === profile?.id) : leads;

  const scopedAppointments = isConsultant
    ? appointments.filter((a) => a.consultant_id === profile?.id)
    : appointments;

  // When a consultant views the page, pass only their own profile so the
  // report modules render a single-row "me" view instead of the full team table.
  const scopedProfiles =
    isConsultant && profile ? profiles.filter((p) => p.id === profile.id) : profiles;

  const dbData = {
    leads: scopedLeads,
    profiles: scopedProfiles,
    appointments: scopedAppointments,
    audit_trail: auditTrail,
    team_goals: teamGoals,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 no-print">
        <div className="hidden sm:block">
          <h1 className="text-2xl font-semibold">{isConsultant ? "My Report" : "Reports"}</h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {isConsultant
              ? "Your personal activity and sales performance report."
              : "Manager-only performance reports — all figures use Manager-verified sales."}
          </p>
        </div>
        <Button onClick={() => setExportOpen(true)}>📤 Smart Export</Button>
      </div>

      {isConsultant && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
          📊 Showing your personal report. Only your leads, activities, and sales are included.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SalesRevenueReport db={dbData} />
        <TrendReport db={dbData} />
        <SourceRoiReport db={dbData} />
        <ActivityVolumeReport db={dbData} />
      </div>
      <SmartExportModal open={exportOpen} onOpenChange={setExportOpen} db={dbData} />
    </div>
  );
}
