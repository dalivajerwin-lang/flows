import { useMemo } from "react";
import { Moon, Phone, StickyNote } from "lucide-react";
import { PanelCard } from "../PanelCard";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useCurrentProfile } from "@/stores/auth-store";
import { STAGE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/tenacious-button";
import { toast } from "sonner";
import { addNote } from "@/stores/leads-store";

export function StagnantLeadsPanel() {
  const profile = useCurrentProfile();
  const { db } = useDashboardData();
  const stagnant = useMemo(() => {
    if (!profile) return [];
    const now = Date.now();
    return db.leads
      .filter(
        (l) =>
          l.assigned_to === profile.id &&
          !l.deleted_at &&
          l.stage !== "closed_sale" &&
          l.stage !== "cancelled" &&
          l.stage !== "archived",
      )
      .map((l) => ({
        l,
        daysSince: Math.floor((now - new Date(l.last_activity_at).getTime()) / 86_400_000),
      }))
      .filter((x) => x.daysSince > 7)
      .sort((a, b) => b.daysSince - a.daysSince);
  }, [db.leads, profile]);

  return (
    <PanelCard
      icon={<Moon size={16} className="text-[var(--color-text-secondary)]" />}
      title="Stagnant Lead Reminders"
    >
      {stagnant.length === 0 ? (
        <p className="text-sm text-[var(--color-text-secondary)]">
          No stagnant leads. Your pipeline is active and moving.
        </p>
      ) : (
        <ul className="space-y-2">
          {stagnant.map(({ l, daysSince }) => (
            <li
              key={l.id}
              className="flex items-center justify-between rounded-md border border-[var(--color-border-muted)] p-3 text-sm"
            >
              <div>
                <div className="font-medium">{l.full_name}</div>
                <div className="text-xs text-[var(--color-text-secondary)]">
                  {STAGE_LABELS[l.stage as keyof typeof STAGE_LABELS]} · {daysSince} days since last
                  contact
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    try {
                      await addNote(l.id, "📞 Called client from Stagnant Leads panel", false);
                      toast.success("Call logged");
                      window.location.href = `tel:${l.contact_number}`;
                    } catch (err: any) {
                      toast.error(err.message || "Failed to log call");
                    }
                  }}
                >
                  <Phone size={12} /> Call
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    const text = window.prompt(
                      `Add a note to restart engagement with ${l.full_name}:`,
                    );
                    if (!text || !text.trim()) return;
                    try {
                      const res = await addNote(l.id, text, false);
                      if (res.ok) {
                        toast.success("Note added");
                      } else {
                        toast.error(res.error || "Failed");
                      }
                    } catch (err: any) {
                      toast.error(err.message || "Failed to add note");
                    }
                  }}
                >
                  <StickyNote size={12} /> Add Note
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  );
}
