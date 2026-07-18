/**
 * Client-side CSV & text digest builders. No 3rd-party libs.
 */
import type { DBShape } from "./selectors";
import type { Period } from "./time-filter";
import {
  selectRevenueSummary,
  selectMonthlyTrend,
  selectSourceRoi,
  selectActivityVolume,
} from "./selectors";

function esc(v: string | number | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows.map((r) => r.map(esc).join(",")).join("\n");
}

export function revenueCsv(db: DBShape, period: Period): string {
  const r = selectRevenueSummary(db, period);
  const header = [
    "Consultant",
    "Closed Sales",
    "Total Value",
    "Avg Sale",
    "Target",
    "Target %",
    "Auto Target",
  ];
  const body = r.rows.map((row) => [
    row.consultant.display_name + (row.isInactive ? " [Inactive]" : ""),
    row.closedCount,
    row.totalValue,
    Math.round(row.avgValue),
    row.targetAmount,
    row.targetPct == null ? "" : row.targetPct.toFixed(1),
    row.targetAuto ? "yes" : "no",
  ]);
  const footer = [
    [],
    ["Team Total", "", r.teamTotal],
    ["Team Goal", "", r.teamGoal],
    ["Pending (buffer)", r.pendingCount, r.pendingValue],
  ];
  return toCsv([header, ...body, ...footer]);
}

export function trendCsv(db: DBShape, monthsBack: number): string {
  const buckets = selectMonthlyTrend(db, monthsBack);
  const consultants = db.profiles.filter((p) => p.role === "property_consultant");
  const header = [
    "Month",
    "Team Revenue",
    "Trippings",
    "Presentations",
    "CRF Submissions",
    ...consultants.flatMap((c) => [`${c.display_name} count`, `${c.display_name} value`]),
  ];
  const body = buckets.map((b) => [
    b.label,
    b.totalValue,
    b.trippings,
    b.presentations,
    b.crfSubmissions,
    ...consultants.flatMap((c) => {
      const p = b.perConsultant[c.id] ?? { count: 0, value: 0 };
      return [p.count, p.value];
    }),
  ]);
  return toCsv([header, ...body]);
}

export function sourceRoiCsv(db: DBShape, period: Period): string {
  const rows = selectSourceRoi(db, period);
  const header = [
    "Source",
    "Leads Added",
    "CRF Reached",
    "Closed Sales",
    "Conversion %",
    "Total Value",
  ];
  const body = rows.map((r) => [
    r.label,
    r.leadsAdded,
    r.crfReached,
    r.closedSales,
    r.conversionPct.toFixed(1),
    r.totalValue,
  ]);
  return toCsv([header, ...body]);
}

export function activityCsv(db: DBShape, period: Period): string {
  const rows = selectActivityVolume(db, period);
  const header = [
    "Consultant",
    "Leads Owned",
    "Trippings",
    "Online Pres.",
    "Actual Pres.",
    "Total Activities",
    "Notes Logged",
    "Activity Rate %",
    "Trippings / Sale",
  ];
  const body = rows.map((r) => [
    r.consultant.display_name + (r.isInactive ? " [Inactive]" : ""),
    r.leadsOwned,
    r.trippings,
    r.onlinePresentations,
    r.actualPresentations,
    r.totalActivities,
    r.notesLogged,
    r.activityRate.toFixed(1),
    r.trippingsPerSale == null ? "" : r.trippingsPerSale.toFixed(2),
  ]);
  return toCsv([header, ...body]);
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildSummaryText(db: DBShape, period: Period): string {
  const rev = selectRevenueSummary(db, period);
  const act = selectActivityVolume(db, period);
  const src = selectSourceRoi(db, period);
  const bestSrc = [...src].sort((a, b) => b.totalValue - a.totalValue)[0];
  const totalLeads = src.reduce((s, r) => s + r.leadsAdded, 0);
  const totalClosed = src.reduce((s, r) => s + r.closedSales, 0);
  const teamTrippings = act.reduce((s, r) => s + r.trippings, 0);
  const teamPres = act.reduce((s, r) => s + r.onlinePresentations + r.actualPresentations, 0);
  return [
    `Team Tenacious — ${period.label}`,
    ``,
    `Revenue (verified): ₱${rev.teamTotal.toLocaleString("en-PH")}`,
    rev.teamGoal > 0
      ? `Team Goal: ₱${rev.teamGoal.toLocaleString("en-PH")} (${rev.teamGoalPct!.toFixed(1)}%)`
      : ``,
    `Pending (buffer): ${rev.pendingCount} sale(s), ₱${rev.pendingValue.toLocaleString("en-PH")}`,
    ``,
    `Leads Added: ${totalLeads}`,
    `Closed Sales: ${totalClosed}`,
    `Trippings: ${teamTrippings} · Presentations: ${teamPres}`,
    bestSrc && bestSrc.totalValue > 0
      ? `Top Source: ${bestSrc.label} (₱${bestSrc.totalValue.toLocaleString("en-PH")})`
      : ``,
    ``,
    `Top Consultants:`,
    ...rev.rows
      .slice(0, 5)
      .map(
        (r, i) =>
          `  ${i + 1}. ${r.consultant.display_name} — ${r.closedCount} sale(s), ₱${r.totalValue.toLocaleString("en-PH")}`,
      ),
  ]
    .filter(Boolean)
    .join("\n");
}
