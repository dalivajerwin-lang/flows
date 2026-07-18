import { useMemo } from "react";
import { Shield, BellRing, Users } from "lucide-react";
import { PanelCard } from "../PanelCard";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/tenacious-button";
import { toast } from "sonner";
import { notify } from "@/lib/notify";
import { useLeadsUI } from "@/stores/leads-store";

export function TeamGuardPanel() {
  const { db } = useDashboardData();
  const idle = useMemo(() => {
    const cutoff = Date.now() - 72 * 3_600_000;
    return db.profiles
      .filter((p) => p.is_active && p.role === "property_consultant")
      .filter((p) => !p.last_login_at || new Date(p.last_login_at).getTime() < cutoff);
  }, [db.profiles]);

  return (
    <PanelCard
      icon={<Shield size={16} className="text-[var(--color-danger-solid)]" />}
      title="Team Guard"
    >
      {idle.length === 0 ? (
        <p className="text-sm text-[var(--color-text-secondary)]">
          All consultants active in the last 72 hours.
        </p>
      ) : (
        <ul className="space-y-2">
          {idle.map((p) => {
            const activeLeads = db.leads.filter(
              (l) => l.assigned_to === p.id && !l.deleted_at,
            ).length;
            return (
              <li
                key={p.id}
                className="rounded-md border border-[var(--color-border-muted)] p-3 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{p.display_name}</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      Last login:{" "}
                      {p.last_login_at
                        ? formatDistanceToNow(new Date(p.last_login_at), { addSuffix: true })
                        : "never"}
                      {" · "}
                      <Users size={10} className="inline" /> {activeLeads} active leads
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        void notify(p.id, "urgent_ping", {
                          title: "Activity Reminder",
                          body: "Your manager is requesting that you log in and review your active leads.",
                          deep_link_path: "/leads",
                        });
                        toast.success(`Reminder notification sent to ${p.display_name}`);
                      }}
                    >
                      <BellRing size={12} /> Send Reminder
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        useLeadsUI.getState().setConsultantFilter(p.id);
                        window.location.href = "/leads";
                      }}
                    >
                      ↔️ Reassign
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PanelCard>
  );
}
