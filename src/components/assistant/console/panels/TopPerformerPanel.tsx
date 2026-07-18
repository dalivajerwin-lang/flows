import { useMemo } from "react";
import { Star, Trophy } from "lucide-react";
import { PanelCard } from "../PanelCard";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { compactPeso } from "@/lib/format-currency";
import { Button } from "@/components/ui/tenacious-button";
import { useLeadsUI } from "@/stores/leads-store";

function manilaNow() {
  const s = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [y, m, d] = s.split("-").map(Number);
  return { day: d, daysInMonth: new Date(y, m, 0).getDate() };
}

export function TopPerformerPanel() {
  const { db } = useDashboardData();
  const { day, daysInMonth } = manilaNow();
  const active = day > daysInMonth - 5;

  const ranking = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const map = new Map<string, { count: number; value: number; pending: number }>();
    for (const l of db.leads) {
      if (l.stage !== "closed_sale") continue;
      if (!l.sale_payment_date) continue;
      const t = new Date(l.sale_payment_date).getTime();
      if (t < monthStart) continue;
      if (!l.assigned_to) continue;
      const agg = map.get(l.assigned_to) ?? { count: 0, value: 0, pending: 0 };
      if (l.closed_sale_status === "verified") {
        agg.count++;
        agg.value += l.sale_price ?? 0;
      } else {
        agg.pending += l.sale_price ?? 0;
      }
      map.set(l.assigned_to, agg);
    }
    return [...map.entries()]
      .map(([id, agg]) => ({
        id,
        name: db.profiles.find((p) => p.id === id)?.display_name ?? "?",
        ...agg,
      }))
      .sort((a, b) => b.value - a.value);
  }, [db.leads, db.profiles]);

  if (!active) return null;
  const daysRemaining = daysInMonth - day;
  const top = ranking[0];

  return (
    <PanelCard
      icon={<Star size={16} className="text-[var(--color-warning-soft-fg-icon)]" />}
      title="Monthly Top Performer Spotlight"
    >
      {!top ? (
        <p className="text-sm text-[var(--color-text-secondary)]">
          No verified sales yet this month.
        </p>
      ) : (
        <>
          <div className="mb-3 rounded-md border-2 border-[var(--color-warning-soft-border-stronger)] bg-linear-to-br from-[var(--color-warning-soft-bg)] to-white p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-[var(--color-warning-soft-bg-stronger)] text-2xl">
                <Trophy />
              </div>
              <div>
                <div className="text-xs uppercase text-[var(--color-warning-soft-fg-strong)]">
                  #1 This Month
                </div>
                <div className="text-lg font-bold">{top.name}</div>
                <div className="text-sm text-[var(--color-text-soft)]">
                  {top.count} closed · {compactPeso(top.value)} verified
                  {top.pending ? ` · +${compactPeso(top.pending)} pending` : ""}
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs text-[var(--color-text-secondary)]">
              {daysRemaining} day{daysRemaining === 1 ? "" : "s"} remaining
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="mt-3"
              onClick={() => {
                useLeadsUI.getState().setConsultantFilter(top.id);
                window.location.href = "/leads";
              }}
            >
              📋 View Their Leads
            </Button>
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold uppercase text-[var(--color-text-secondary)]">
              Top 3
            </div>
            <ol className="space-y-1 text-sm">
              {ranking.slice(0, 3).map((r, i) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded border border-[var(--color-border-subtle)] px-2 py-1"
                >
                  <span>
                    #{i + 1} · {r.name}
                  </span>
                  <span className="font-medium">{compactPeso(r.value)}</span>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
    </PanelCard>
  );
}
