import { useMemo } from "react";
import { Target } from "lucide-react";
import { PanelCard } from "../PanelCard";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useCurrentProfile } from "@/stores/auth-store";
import { selectVerifiedSalesValue, selectPendingSalesValue } from "@/lib/dashboard-selectors";
import { compactPeso } from "@/lib/format-currency";

export function GoalTrackerPanel() {
  const profile = useCurrentProfile();
  const { db } = useDashboardData();
  const target = profile?.personal_monthly_target ?? 0;
  const verified = useMemo(
    () => (profile ? selectVerifiedSalesValue(db, { kind: "consultant", userId: profile.id }) : 0),
    [db, profile],
  );
  const pending = useMemo(
    () => (profile ? selectPendingSalesValue(db, { kind: "consultant", userId: profile.id }) : 0),
    [db, profile],
  );
  const pct = target > 0 ? Math.min(100, Math.round((verified / target) * 100)) : 0;
  const day = new Date().getDate();
  const dailyPace = day > 0 ? verified / day : 0;
  const projected = dailyPace * 30;

  return (
    <PanelCard
      icon={<Target size={16} className="text-[var(--color-primary)]" />}
      title="Personal Goal Tracker"
    >
      <div className="mb-2 flex items-baseline justify-between text-sm">
        <span className="font-semibold">
          {compactPeso(verified)} / {compactPeso(target)}
        </span>
        <span className="text-[var(--color-text-secondary)]">{pct}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-[var(--color-text-secondary)]">Projected total</dt>
          <dd className="font-semibold">{compactPeso(projected)}</dd>
        </div>
        <div>
          <dt className="text-[var(--color-text-secondary)]">Pending buffer</dt>
          <dd className="font-semibold text-[var(--color-warning-soft-fg-strong)]">
            +{compactPeso(pending)}
          </dd>
        </div>
      </dl>
    </PanelCard>
  );
}
