import { useState } from "react";
import { selectSourceRoi, type DBShape } from "@/lib/reports/selectors";
import { monthPeriod, type Period } from "@/lib/reports/time-filter";
import { compactPeso, exactPeso } from "@/lib/format-currency";
import { PeriodPicker } from "./period-picker";
import { ReportCard, EmptyStateBlock } from "./report-card";

export function SourceRoiReport({ db }: { db: DBShape }) {
  const [period, setPeriod] = useState<Period>(monthPeriod());
  const [consultantId, setConsultantId] = useState<string>("");
  const consultants = db.profiles.filter((p) => p.role === "property_consultant");
  const rows = selectSourceRoi(db, period, consultantId || undefined);
  const bestConv = [...rows]
    .filter((r) => r.leadsAdded > 0)
    .sort((a, b) => b.conversionPct - a.conversionPct)[0];
  const bestRev = [...rows].sort((a, b) => b.totalValue - a.totalValue)[0];
  const maxCount = Math.max(1, ...rows.map((r) => Math.max(r.leadsAdded, r.closedSales)));
  const hasData = rows.some((r) => r.leadsAdded > 0 || r.closedSales > 0);

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={consultantId}
        onChange={(e) => setConsultantId(e.target.value)}
        className="min-h-[32px] rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white px-2 text-xs"
      >
        <option value="">All consultants</option>
        {consultants.map((c) => (
          <option key={c.id} value={c.id}>
            {c.display_name}
          </option>
        ))}
      </select>
      <PeriodPicker value={period} onChange={setPeriod} />
    </div>
  );

  return (
    <ReportCard title="Lead Source ROI" icon="🎯" toolbar={toolbar}>
      {!hasData ? (
        <EmptyStateBlock />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-[var(--color-text-secondary)]">
                <tr>
                  <th className="py-2 pr-3">Source</th>
                  <th className="py-2 pr-3">Leads</th>
                  <th className="py-2 pr-3">CRF</th>
                  <th className="py-2 pr-3">Closed</th>
                  <th className="py-2 pr-3">Conv.</th>
                  <th className="py-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.source} className="border-t border-[var(--color-border)]">
                    <td className="py-2 pr-3 font-medium">
                      {r.label}
                      {bestConv?.source === r.source && r.leadsAdded > 0 && (
                        <span className="ml-1 text-xs">⭐</span>
                      )}
                      {bestRev?.source === r.source && r.totalValue > 0 && (
                        <span className="ml-1 text-xs">💰</span>
                      )}
                    </td>
                    <td className="py-2 pr-3">{r.leadsAdded}</td>
                    <td className="py-2 pr-3">{r.crfReached}</td>
                    <td className="py-2 pr-3">{r.closedSales}</td>
                    <td className="py-2 pr-3">{r.conversionPct.toFixed(1)}%</td>
                    <td className="py-2">{exactPeso(r.totalValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-[var(--color-text-secondary)]">
              Leads vs Closed (per source)
            </div>
            {rows
              .filter((r) => r.leadsAdded > 0 || r.closedSales > 0)
              .map((r) => (
                <div key={r.source} className="flex items-center gap-2 text-xs">
                  <span className="w-28 shrink-0 truncate">{r.label}</span>
                  <div className="flex-1 space-y-0.5">
                    <div
                      className="h-2 rounded bg-[var(--color-primary-light)]"
                      style={{ width: `${(r.leadsAdded / maxCount) * 100}%` }}
                      title={`Leads: ${r.leadsAdded}`}
                    />
                    <div
                      className="h-2 rounded bg-[var(--color-primary)]"
                      style={{ width: `${(r.closedSales / maxCount) * 100}%` }}
                      title={`Closed: ${r.closedSales}`}
                    />
                  </div>
                  <span className="w-16 text-right text-[10px] text-[var(--color-text-secondary)]">
                    {compactPeso(r.totalValue)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </ReportCard>
  );
}
