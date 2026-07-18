import { useState } from "react";
import { selectActivityVolume, type DBShape } from "@/lib/reports/selectors";
import { monthPeriod, type Period } from "@/lib/reports/time-filter";
import { PeriodPicker } from "./period-picker";
import { ReportCard, EmptyStateBlock } from "./report-card";

export function ActivityVolumeReport({ db }: { db: DBShape }) {
  const [period, setPeriod] = useState<Period>(monthPeriod());
  const rows = selectActivityVolume(db, period);
  const hasData = rows.some((r) => r.totalActivities > 0 || r.leadsOwned > 0);

  return (
    <ReportCard
      title="Activity Volume"
      icon="🏃"
      toolbar={<PeriodPicker value={period} onChange={setPeriod} />}
    >
      {!hasData ? (
        <EmptyStateBlock />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-[var(--color-text-secondary)]">
              <tr>
                <th className="py-2 pr-3">Consultant</th>
                <th className="py-2 pr-3">Leads</th>
                <th className="py-2 pr-3">Trip.</th>
                <th className="py-2 pr-3">Online</th>
                <th className="py-2 pr-3">Actual</th>
                <th className="py-2 pr-3">Notes</th>
                <th className="py-2 pr-3">Total</th>
                <th className="py-2 pr-3">Rate</th>
                <th className="py-2">Trip/Sale</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.consultant.id} className="border-t border-[var(--color-border)]">
                  <td className="py-2 pr-3 font-medium">
                    {r.consultant.display_name}
                    {r.isInactive && (
                      <span className="ml-1 text-xs text-[var(--color-text-secondary)]">
                        [Inactive]
                      </span>
                    )}
                    {r.totalActivities === 0 && !r.isInactive && (
                      <span className="ml-2 rounded bg-[var(--color-danger-soft-bg-stronger)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-danger-soft-fg)]">
                        ⚠️ No Activity
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3">{r.leadsOwned}</td>
                  <td className="py-2 pr-3">{r.trippings}</td>
                  <td className="py-2 pr-3">{r.onlinePresentations}</td>
                  <td className="py-2 pr-3">{r.actualPresentations}</td>
                  <td className="py-2 pr-3">{r.notesLogged}</td>
                  <td className="py-2 pr-3 font-semibold">{r.totalActivities}</td>
                  <td className="py-2 pr-3">{r.activityRate.toFixed(0)}%</td>
                  <td className="py-2">
                    {r.trippingsPerSale == null ? "—" : r.trippingsPerSale.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ReportCard>
  );
}
