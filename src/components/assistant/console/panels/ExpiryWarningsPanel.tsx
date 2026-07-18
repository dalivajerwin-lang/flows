import { useMemo } from "react";
import { Hourglass } from "lucide-react";
import { PanelCard } from "../PanelCard";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useCurrentProfile } from "@/stores/auth-store";
import { useTicker } from "@/stores/ticker-store";
import { Button } from "@/components/ui/tenacious-button";
import { toast } from "sonner";
import { extendCRF, transitionLead } from "@/stores/pipeline-store";

function fmtRemaining(ms: number): string {
  if (ms <= 0) return "expired";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function ExpiryWarningsPanel() {
  const profile = useCurrentProfile();
  useTicker(); // subscribe to tick
  const { db } = useDashboardData();

  const items = useMemo(() => {
    if (!profile) return { reservations: [], crfs: [] };
    const now = Date.now();
    const own = db.leads.filter((l) => l.assigned_to === profile.id && !l.deleted_at);
    const reservations = own.filter((l) => {
      if (l.stage !== "reserved" || !l.reservation_expires_at) return false;
      const remaining = new Date(l.reservation_expires_at).getTime() - now;
      return remaining > 0 && remaining < 24 * 3_600_000;
    });
    const crfs = own.filter((l) => {
      if (!l.crf_expires_at || l.stage !== "crf") return false;
      const remaining = new Date(l.crf_expires_at).getTime() - now;
      return remaining > 0 && remaining < 3 * 86_400_000;
    });
    return { reservations, crfs };
  }, [db.leads, profile]);

  const empty = items.reservations.length === 0 && items.crfs.length === 0;

  return (
    <PanelCard
      icon={<Hourglass size={16} className="text-[var(--color-warning-soft-fg-icon)]" />}
      title="Expiry Warnings"
      defaultExpanded
    >
      {empty ? (
        <p className="text-sm text-[var(--color-text-secondary)]">
          Great job! None of your leads are currently stagnant or expiring.
        </p>
      ) : (
        <div className="space-y-3">
          {items.reservations.map((l) => (
            <div
              key={l.id}
              className="rounded-md border border-[var(--color-danger-soft-border)] bg-[var(--color-danger-soft-bg)] p-3 text-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{l.full_name}</div>
                  <div className="text-xs text-[var(--color-danger-soft-fg)]">
                    ⏰ Res. Expires in{" "}
                    {fmtRemaining(new Date(l.reservation_expires_at!).getTime() - Date.now())}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    if (!profile) return;
                    try {
                      const res = await transitionLead(
                        l.id,
                        "documentation",
                        { documentation_start_date: new Date().toISOString() },
                        { id: profile.id, role: profile.role },
                      );
                      if (res.ok) {
                        toast.success("Payment confirmed. Stage updated to Documentation.");
                      } else {
                        toast.error(res.error);
                      }
                    } catch (err: any) {
                      toast.error(err.message || "Failed to confirm payment");
                    }
                  }}
                >
                  💳 Confirm Payment
                </Button>
              </div>
            </div>
          ))}
          {items.crfs.map((l) => {
            const daysLeft = Math.floor(
              (new Date(l.crf_expires_at!).getTime() - Date.now()) / 86_400_000,
            );
            return (
              <div
                key={l.id}
                className="rounded-md border border-[var(--color-warning-soft-border)] bg-[var(--color-warning-soft-bg)] p-3 text-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{l.full_name}</div>
                    <div className="text-xs text-[var(--color-warning-soft-fg)]">
                      ⚠️ CRF Expires in {daysLeft} day{daysLeft === 1 ? "" : "s"}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      if (!profile) return;
                      const reason = window.prompt("Reason for extending CRF (min 5 chars):");
                      if (!reason) return;
                      try {
                        const r = await extendCRF(l.id, reason, {
                          id: profile.id,
                          role: profile.role,
                        });
                        if (r.ok) {
                          toast.success(
                            r.pending
                              ? "Extension request sent to manager"
                              : "CRF extended 30 days",
                          );
                        } else {
                          toast.error(r.error || "Failed");
                        }
                      } catch (err: any) {
                        toast.error(err.message || "Failed to extend CRF");
                      }
                    }}
                  >
                    🔄 Extend CRF
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PanelCard>
  );
}
