import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { type DBShape } from "@/lib/reports/selectors";
import { useCurrentProfile } from "@/stores/auth-store";
import { isManagerish } from "@/hooks/use-role";
import {
  weekPeriod,
  monthPeriod,
  allTimePeriod,
  type Period,
  currentMonthKey,
} from "@/lib/reports/time-filter";
import {
  revenueCsv,
  trendCsv,
  sourceRoiCsv,
  activityCsv,
  downloadCsv,
  buildSummaryText,
} from "@/lib/reports/csv";
import { selectRevenueSummary, selectActivityVolume } from "@/lib/reports/selectors";
import { exactPeso } from "@/lib/format-currency";

type ReportKey = "revenue" | "trend" | "source" | "activity";
const REPORT_LABELS: Record<ReportKey, string> = {
  revenue: "Sales Revenue Summary",
  trend: "Month-over-Month Trend",
  source: "Lead Source ROI",
  activity: "Activity Volume",
};

export function SmartExportModal({
  open,
  onOpenChange,
  db,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  db: DBShape;
}) {
  const profile = useCurrentProfile();
  const manager = isManagerish(profile?.role ?? null);
  const [periodKind, setPeriodKind] = useState<"week" | "month" | "all">("month");
  const [monthKey, setMonthKey] = useState<string>(currentMonthKey());
  const [selected, setSelected] = useState<Record<ReportKey, boolean>>({
    revenue: true,
    trend: false,
    source: false,
    activity: manager ? false : true,
  });

  const period: Period = useMemo(() => {
    if (periodKind === "week") return weekPeriod();
    if (periodKind === "all") return allTimePeriod();
    return monthPeriod(monthKey);
  }, [periodKind, monthKey]);

  const activeReports = (Object.keys(selected) as ReportKey[]).filter((k) => selected[k]);

  const exportCsv = () => {
    if (!activeReports.length) return toast("Select at least one report.");
    const stamp = period.monthKey ?? (period.kind === "week" ? "week" : "all-time");
    for (const key of activeReports) {
      const csv =
        key === "revenue"
          ? revenueCsv(db, period)
          : key === "trend"
            ? trendCsv(db, 6)
            : key === "source"
              ? sourceRoiCsv(db, period)
              : activityCsv(db, period);
      downloadCsv(`${key}_${stamp}.csv`, csv);
    }
    toast(`Exported ${activeReports.length} CSV file(s).`);
  };

  const copySummary = async () => {
    try {
      const text = buildSummaryText(db, period);
      await navigator.clipboard.writeText(text);
      toast("📋 Summary copied to clipboard.");
    } catch {
      toast.error("Could not copy — check clipboard permissions.");
    }
  };

  const printPdf = () => {
    document.body.classList.add("print-report-only");
    setTimeout(() => {
      window.print();
      setTimeout(() => document.body.classList.remove("print-report-only"), 200);
    }, 50);
  };

  // Preview: quick numbers
  const rev = selectRevenueSummary(db, period);
  const act = selectActivityVolume(db, period);
  const teamTrippings = act.reduce((s, r) => s + r.trippings, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>📤 Smart Export</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Config */}
          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase text-[var(--color-text-secondary)]">Period</Label>
              <div className="mt-1 flex gap-1">
                {(["week", "month", "all"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setPeriodKind(k)}
                    className={`min-h-[32px] flex-1 rounded-[var(--radius-sm)] border px-2 text-xs font-medium ${periodKind === k ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]" : "border-[var(--color-border)] bg-[var(--color-background)]"}`}
                  >
                    {k === "week" ? "This Week" : k === "month" ? "Monthly" : "All Time"}
                  </button>
                ))}
              </div>
              {periodKind === "month" && (
                <input
                  type="month"
                  value={monthKey}
                  onChange={(e) => setMonthKey(e.target.value)}
                  className="mt-2 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2 py-1 text-sm"
                />
              )}
            </div>
            {manager && (
              <div>
                <Label className="text-xs uppercase text-[var(--color-text-secondary)]">
                  Reports
                </Label>
                <div className="mt-1 space-y-1.5">
                  {(Object.keys(REPORT_LABELS) as ReportKey[]).map((k) => (
                    <label key={k} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={selected[k]}
                        onCheckedChange={(v) => setSelected((s) => ({ ...s, [k]: v === true }))}
                      />
                      {REPORT_LABELS[k]}
                    </label>
                  ))}
                </div>
              </div>
            )}
            {!manager && (
              <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-xs text-[var(--color-text-secondary)]">
                Personal summary — your own sales & activity for the selected period.
              </div>
            )}
          </div>
          {/* Live preview */}
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-xs">
            <div className="mb-2 font-semibold">Preview — {period.label}</div>
            <div className="space-y-1">
              <div>
                Verified revenue: <b>{exactPeso(rev.teamTotal)}</b>
              </div>
              <div>
                Closed sales: <b>{rev.rows.reduce((s, r) => s + r.closedCount, 0)}</b>
              </div>
              <div>
                Pending (buffer): <b>{rev.pendingCount}</b> · {exactPeso(rev.pendingValue)}
              </div>
              <div>
                Team trippings: <b>{teamTrippings}</b>
              </div>
              {manager && (
                <div className="mt-2 text-[var(--color-text-secondary)]">
                  Files to export:{" "}
                  {activeReports.length
                    ? activeReports.map((k) => REPORT_LABELS[k]).join(", ")
                    : "none"}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="outline" onClick={copySummary}>
            📋 Copy Summary
          </Button>
          <Button variant="outline" onClick={exportCsv}>
            📥 Export CSV
          </Button>
          <Button onClick={printPdf}>🖨️ Print / PDF</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
