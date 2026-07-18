import { useMemo } from "react";
import { AlertTriangle, BellRing } from "lucide-react";
import { PanelCard } from "../PanelCard";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { format } from "date-fns";
import { Button } from "@/components/ui/tenacious-button";
import { toast } from "sonner";
import { useCurrentProfile } from "@/stores/auth-store";
import { notify } from "@/lib/notify";

export function BottleneckPanel() {
  const profile = useCurrentProfile();
  const { db } = useDashboardData();
  const items = useMemo(() => {
    const cutoff = Date.now() - 20 * 86_400_000;
    return db.leads
      .filter(
        (l) =>
          l.stage === "documentation" &&
          !l.deleted_at &&
          new Date(l.stage_changed_at).getTime() < cutoff,
      )
      .map((l) => ({
        l,
        days: Math.floor((Date.now() - new Date(l.stage_changed_at).getTime()) / 86_400_000),
        agent: db.profiles.find((p) => p.id === l.assigned_to)?.display_name ?? "—",
      }));
  }, [db.leads, db.profiles]);

  return (
    <PanelCard
      icon={<AlertTriangle size={16} className="text-[var(--color-warning-soft-fg-icon)]" />}
      title="Bottleneck Alert"
    >
      {items.length === 0 ? (
        <p className="text-sm text-[var(--color-text-secondary)]">No documentation bottlenecks.</p>
      ) : (
        <ul className="space-y-2">
          {items.map(({ l, days, agent }) => (
            <li
              key={l.id}
              className="rounded-md border border-[var(--color-border-muted)] p-3 text-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <button
                    onClick={() => {
                      window.location.href = `/leads?lead=${l.id}`;
                    }}
                    className="font-medium text-[var(--color-primary)] hover:underline text-left"
                  >
                    {l.full_name}
                  </button>
                  <div className="text-xs text-[var(--color-text-secondary)]">
                    {agent} · {days} days · last: {format(new Date(l.last_activity_at), "MMM d")}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    if (l.assigned_to) {
                      void notify(l.assigned_to, "urgent_ping", {
                        title: "Documentation Stagnation Alert",
                        body: `Manager ${profile?.display_name || ""} flagged lead ${l.full_name} (> 20 days in Documentation stage). Please follow up.`,
                        deep_link_path: `/leads?lead=${l.id}`,
                        lead_id: l.id,
                      });
                    }
                    toast.success(`Pinged ${agent}`);
                  }}
                >
                  <BellRing size={12} /> Ping Agent
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  );
}
