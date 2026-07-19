import { useState } from "react";
import { selectMonthlyTrend, type DBShape } from "@/lib/reports/selectors";
import { compactPeso } from "@/lib/format-currency";
import { ReportCard, EmptyStateBlock } from "./report-card";
import { cn } from "@/lib/utils";

export function TrendReport({ db }: { db: DBShape }) {
  const [monthsBack, setMonthsBack] = useState<3 | 6>(3);
  const buckets = selectMonthlyTrend(db, monthsBack);
  const consultants = db.profiles.filter((p) => p.role === "property_consultant");
  const max = Math.max(1, ...buckets.map((b) => b.totalValue));
  const hasData = buckets.some((b) => b.totalValue > 0);

  const toolbar = (
    <div className="inline-flex rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-background)] p-0.5 text-xs">
      {[3, 6].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => setMonthsBack(n as 3 | 6)}
          className={cn(
            "min-h-[32px] rounded-[var(--radius-pill)] px-3 font-medium transition-tenacious",
            monthsBack === n
              ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]",
          )}
        >
          {n}M
        </button>
      ))}
    </div>
  );

  return (
    <ReportCard title="Month-over-Month Trend" icon="📈" toolbar={toolbar}>
      {!hasData ? (
        <EmptyStateBlock />
      ) : (
        <div className="space-y-4">
          <div className="flex items-end gap-3 border-b border-[var(--color-border)] pb-4">
            {buckets.map((b) => {
              const h = (b.totalValue / max) * 120;
              return (
                <div key={b.monthKey} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-[var(--color-primary)]"
                    style={{ height: `${Math.max(4, h)}px` }}
                    title={`${b.label}: ${compactPeso(b.totalValue)}`}
                  />
                  <div className="text-[10px] font-medium">{b.label.slice(0, 3)}</div>
                  <div className="text-[10px] text-[var(--color-text-secondary)]">
                    {compactPeso(b.totalValue)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-[var(--color-text-secondary)]">
                <tr>
                  <th className="py-1 pr-3">Consultant</th>
                  {buckets.map((b) => (
                    <th key={b.monthKey} className="py-1 pr-3">
                      {b.label.split(" ")[0].slice(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {consultants.map((c) => (
                  <tr key={c.id} className="border-t border-[var(--color-border)]">
                    <td className="py-1.5 pr-3 font-medium">{c.display_name}</td>
                    {buckets.map((b, i) => {
                      const cur = b.perConsultant[c.id] ?? { count: 0, value: 0 };
                      const prev = i > 0 ? buckets[i - 1].perConsultant[c.id] : null;
                      const arrow = prev ? (
                        cur.value > prev.value ? (
                          <span className="text-[var(--color-success-soft-fg-icon)]">↑</span>
                        ) : cur.value < prev.value ? (
                          <span className="text-[var(--color-danger-soft-fg-alt)]">↓</span>
                        ) : null
                      ) : null;
                      return (
                        <td key={b.monthKey} className="py-1.5 pr-3">
                          {cur.count}/{compactPeso(cur.value)} {arrow}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
            <div className="mb-2 text-xs font-medium text-[var(--color-text-secondary)]">
              Team Activity Trend
            </div>
            <table className="w-full text-xs">
              <thead className="text-left text-[var(--color-text-secondary)]">
                <tr>
                  <th className="py-1">Month</th>
                  <th className="py-1">Trippings</th>
                  <th className="py-1">Presentations</th>
                  <th className="py-1">CRF Submitted</th>
                </tr>
              </thead>
              <tbody>
                {buckets.map((b) => (
                  <tr key={b.monthKey} className="border-t border-[var(--color-border)]">
                    <td className="py-1">{b.label}</td>
                    <td className="py-1">{b.trippings}</td>
                    <td className="py-1">{b.presentations}</td>
                    <td className="py-1">{b.crfSubmissions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ReportCard>
  );
}
