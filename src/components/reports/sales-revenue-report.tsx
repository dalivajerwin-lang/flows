import { useState } from "react";
import { selectRevenueSummary, type DBShape } from "@/lib/reports/selectors";
import { weekPeriod, type Period } from "@/lib/reports/time-filter";
import { exactPeso } from "@/lib/format-currency";
import { PeriodPicker } from "./period-picker";
import { ReportCard, EmptyStateBlock } from "./report-card";

export function SalesRevenueReport({ db }: { db: DBShape }) {
  const [period, setPeriod] = useState<Period>(weekPeriod());
  const data = selectRevenueSummary(db, period);
  const hasData = data.rows.some((r) => r.closedCount > 0) || data.pendingCount > 0;

  return (
    <ReportCard
      title="Sales Revenue Summary"
      icon="💰"
      toolbar={<PeriodPicker value={period} onChange={setPeriod} />}
    >
      {!hasData ? (
        <EmptyStateBlock />
      ) : (
        <div className="space-y-4">
          <div>
            <div className="text-xs uppercase text-[var(--color-text-secondary)]">
              Team Total Verified Revenue
            </div>
            <div className="text-3xl font-bold text-[var(--color-primary)]">
              {exactPeso(data.teamTotal)}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-[var(--color-text-secondary)]">
                <tr>
                  <th className="py-2 pr-3">Consultant</th>
                  <th className="py-2 pr-3">Closed</th>
                  <th className="py-2 pr-3">Total Value</th>
                  <th className="py-2 pr-3">Avg. Sale</th>
                  <th className="py-2">vs. Target</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.consultant.id} className="border-t border-[var(--color-border)]">
                    <td className="py-2 pr-3 font-medium">
                      {r.consultant.display_name}
                      {r.isInactive && (
                        <span className="ml-1 text-xs text-[var(--color-text-secondary)]">
                          [Inactive]
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3">{r.closedCount}</td>
                    <td className="py-2 pr-3">{exactPeso(r.totalValue)}</td>
                    <td className="py-2 pr-3">
                      {r.closedCount > 0 ? exactPeso(Math.round(r.avgValue)) : "—"}
                    </td>
                    <td className="py-2">
                      {r.targetPct == null ? (
                        "—"
                      ) : (
                        <span
                          className={
                            r.targetPct >= 100
                              ? "text-[var(--color-success-soft-fg-icon)]"
                              : r.targetPct < 50
                                ? "text-[var(--color-danger-soft-fg-alt)]"
                                : ""
                          }
                        >
                          {r.targetPct.toFixed(0)}%
                          {r.targetPct >= 100 ? " ✅" : r.targetPct < 50 ? " 🔴" : ""}
                          {r.targetAuto && (
                            <span className="ml-1 text-xs text-[var(--color-text-secondary)]">
                              (Auto)
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-dashed border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]">
                  <td className="py-2 pr-3 italic">Pending (awaiting verification)</td>
                  <td className="py-2 pr-3">{data.pendingCount}</td>
                  <td className="py-2 pr-3">{exactPeso(data.pendingValue)}</td>
                  <td colSpan={2} className="py-2 italic">
                    not included in totals
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {data.teamGoal > 0 && data.teamGoalPct != null && (
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium">Team Goal Attainment</span>
                <span className="text-[var(--color-text-secondary)]">
                  {exactPeso(data.teamTotal)} of {exactPeso(data.teamGoal)} —{" "}
                  {data.teamGoalPct.toFixed(1)}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-surface)]">
                <div
                  className="h-full bg-[var(--color-primary)]"
                  style={{ width: `${Math.min(100, data.teamGoalPct)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </ReportCard>
  );
}
