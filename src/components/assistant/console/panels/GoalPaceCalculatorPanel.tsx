import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { PanelCard } from "../PanelCard";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import {
  selectVerifiedSalesValue,
  selectPendingSalesValue,
  selectTeamGoal,
} from "@/lib/dashboard-selectors";
import { compactPeso } from "@/lib/format-currency";

export function GoalPaceCalculatorPanel() {
  const { db } = useDashboardData();
  const verified = useMemo(() => selectVerifiedSalesValue(db, { kind: "team" }), [db]);
  const pending = useMemo(() => selectPendingSalesValue(db, { kind: "team" }), [db]);
  const target = useMemo(() => selectTeamGoal(db) ?? 0, [db]);
  const day = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const dailyPace = day > 0 ? verified / day : 0;
  const projected = dailyPace * daysInMonth;
  const gap = target - projected;
  const pct = target > 0 ? Math.round((projected / target) * 100) : 0;

  return (
    <PanelCard
      icon={<BarChart3 size={16} className="text-[var(--color-primary)]" />}
      title="Goal Pace Calculator"
    >
      <div className="space-y-2 text-sm">
        <div>
          {day} days done, {compactPeso(verified)} closed = <b>{compactPeso(dailyPace)}/day</b> pace
        </div>
        <div>
          Projected month-end: <b>{compactPeso(projected)}</b> ({pct}% of goal)
        </div>
        {gap <= 0 ? (
          <div className="rounded-md bg-[var(--color-success-soft-bg)] p-2 text-[var(--color-success-soft-fg-alt)]">
            Projected to hit {pct}% of {compactPeso(target)} goal ✅
          </div>
        ) : (
          <div className="rounded-md bg-[var(--color-warning-soft-bg)] p-2 text-[var(--color-warning-soft-fg)]">
            Still needs {compactPeso(gap)} to hit goal pace ⚠️
          </div>
        )}
        <div className="pt-1 text-xs text-[var(--color-text-secondary)]">
          Pending verification buffer: +{compactPeso(pending)}
        </div>
      </div>
    </PanelCard>
  );
}
