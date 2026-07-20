/**
 * Report & Leaderboard selectors — pure functions taking DBShape + a Period.
 * Only Manager-verified sales count anywhere. All time filtering keys on
 * `closed_sale_verified_at`, never submission time.
 */
import type { Database } from "@/types/supabase";

export type Lead = Omit<
  Database["public"]["Tables"]["leads"]["Row"],
  "archived_at" | "archive_reason" | "version"
> & {
  archived_at?: string | null;
  archive_reason?: string | null;
  version?: number;
};
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type TeamGoal = Database["public"]["Tables"]["team_goals"]["Row"];
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
export type AuditEntry = Omit<Database["public"]["Tables"]["audit_trail"]["Row"], "meta"> & {
  meta?: any;
};

export interface DBShape {
  leads: Lead[];
  profiles: Profile[];
  team_goals: TeamGoal[];
  appointments: Appointment[];
  audit_trail: AuditEntry[];
}
import type { LeadSource } from "@/lib/lead-sources";
import { LEAD_SOURCES, LEAD_SOURCE_LABELS } from "@/lib/lead-sources";
import type { Period } from "./time-filter";
import { inPeriod, monthPeriod, shiftMonthKey, currentMonthKey } from "./time-filter";

/** Trashed and training/sample leads never count toward reports. */
function isReportableLead(l: Lead): boolean {
  return !l.deleted_at && !l.is_sample;
}

// ---------- Leaderboard ----------

export interface LeaderboardRow {
  consultant: Profile;
  isInactive: boolean;
  closedCount: number;
  closedValue: number;
  rank: number;
}

function verifiedInPeriod(l: Lead, period: Period): boolean {
  if (isReportableLead(l) && l.stage === "closed_sale" && l.closed_sale_status === "verified") {
    // Prefer the verified timestamp; fall back to updated_at if verified_at is missing
    const ts = l.closed_sale_verified_at ?? l.updated_at;
    return inPeriod(ts, period);
  }
  return false;
}

export function selectLeaderboard(db: DBShape, period: Period): LeaderboardRow[] {
  // Only property consultants appear on the leaderboard.
  // Managers have personal clients but are excluded from rankings.
  const consultants = db.profiles.filter((p) => p.role === "property_consultant");
  const rows = consultants.map((c) => {
    const sales = db.leads.filter((l) => l.assigned_to === c.id && verifiedInPeriod(l, period));
    return {
      consultant: c,
      isInactive: !c.is_active,
      closedCount: sales.length,
      closedValue: sales.reduce((s, l) => s + (l.sale_price ?? 0), 0),
      rank: 0,
    };
  });
  // Deactivated consultants only shown for periods where they had sales.
  const filtered = rows.filter((r) => !r.isInactive || r.closedCount > 0);
  filtered.sort((a, b) => {
    if (b.closedValue !== a.closedValue) return b.closedValue - a.closedValue;
    if (b.closedCount !== a.closedCount) return b.closedCount - a.closedCount;
    return a.consultant.display_name.localeCompare(b.consultant.display_name);
  });
  filtered.forEach((r, i) => (r.rank = i + 1));
  return filtered;
}

// ---------- CRF Leaderboard ----------

export interface CrfLeaderboardRow {
  consultant: Profile;
  isInactive: boolean;
  /** Leads that first entered the CRF stage during the period. */
  crfCount: number;
  /** How many of those progressed to reserved or beyond. */
  progressedCount: number;
  rank: number;
}

const CRF_PROGRESSED_STAGES = new Set(["reserved", "documentation", "closed_sale"]);

export function selectCrfLeaderboard(db: DBShape, period: Period): CrfLeaderboardRow[] {
  const consultants = db.profiles.filter((p) => p.role === "property_consultant");
  const rows = consultants.map((c) => {
    const crfs = db.leads.filter(
      (l) =>
        l.assigned_to === c.id &&
        isReportableLead(l) &&
        l.crf_first_entered_at != null &&
        inPeriod(l.crf_first_entered_at, period),
    );
    return {
      consultant: c,
      isInactive: !c.is_active,
      crfCount: crfs.length,
      progressedCount: crfs.filter((l) => CRF_PROGRESSED_STAGES.has(l.stage)).length,
      rank: 0,
    };
  });
  // Mirror the sales board: deactivated consultants only shown when they scored.
  const filtered = rows.filter((r) => !r.isInactive || r.crfCount > 0);
  filtered.sort((a, b) => {
    if (b.crfCount !== a.crfCount) return b.crfCount - a.crfCount;
    if (b.progressedCount !== a.progressedCount) return b.progressedCount - a.progressedCount;
    return a.consultant.display_name.localeCompare(b.consultant.display_name);
  });
  filtered.forEach((r, i) => (r.rank = i + 1));
  return filtered;
}

// ---------- Report 1: Sales Revenue Summary ----------

export interface RevenueRow {
  consultant: Profile;
  isInactive: boolean;
  closedCount: number;
  totalValue: number;
  avgValue: number;
  targetAmount: number;
  targetAuto: boolean;
  targetPct: number | null;
}

export function selectRevenueSummary(db: DBShape, period: Period) {
  const consultants = db.profiles.filter((p) => p.role === "property_consultant");
  const activeConsultants = consultants.filter((c) => c.is_active).length;
  const teamMonth = db.team_goals.find((g) => g.month === currentMonthKey())?.target_amount ?? 0;

  const rows: RevenueRow[] = consultants.map((c) => {
    const sales = db.leads.filter((l) => l.assigned_to === c.id && verifiedInPeriod(l, period));
    const total = sales.reduce((s, l) => s + (l.sale_price ?? 0), 0);
    const count = sales.length;
    const explicit = c.personal_monthly_target > 0;
    const targetAmount = explicit
      ? c.personal_monthly_target
      : teamMonth && activeConsultants
        ? Math.round(teamMonth / activeConsultants)
        : 0;
    const targetAuto = !explicit;
    return {
      consultant: c,
      isInactive: !c.is_active,
      closedCount: count,
      totalValue: total,
      avgValue: count > 0 ? total / count : 0,
      targetAmount,
      targetAuto,
      targetPct: !c.is_active ? null : targetAmount > 0 ? (total / targetAmount) * 100 : null,
    };
  });
  rows.sort((a, b) => b.totalValue - a.totalValue);
  const teamTotal = rows.reduce((s, r) => s + r.totalValue, 0);
  // Pending buffer — filtered by same period but on "created_at" of the pending
  // record (or simply all pending, since "pending" has no verification date).
  // Spec: buffer row shown separately, never summed. We show all currently-pending.
  const pendingLeads = db.leads.filter(
    (l) =>
      isReportableLead(l) &&
      l.stage === "closed_sale" &&
      l.closed_sale_status === "pending_verification",
  );
  const pendingValue = pendingLeads.reduce((s, l) => s + (l.sale_price ?? 0), 0);
  return {
    rows,
    teamTotal,
    teamGoal: teamMonth,
    teamGoalPct: teamMonth > 0 ? (teamTotal / teamMonth) * 100 : null,
    pendingCount: pendingLeads.length,
    pendingValue,
  };
}

// ---------- Report 2: Month-over-Month Trend ----------

export interface MonthBucket {
  monthKey: string;
  label: string;
  totalValue: number;
  perConsultant: Record<string, { count: number; value: number }>;
  trippings: number;
  presentations: number;
  crfSubmissions: number;
}

export function selectMonthlyTrend(db: DBShape, monthsBack: number): MonthBucket[] {
  const consultants = db.profiles.filter((p) => p.role === "property_consultant");
  const buckets: MonthBucket[] = [];
  const currentKey = currentMonthKey();
  for (let i = monthsBack - 1; i >= 0; i--) {
    const key = shiftMonthKey(currentKey, -i);
    const period = monthPeriod(key);
    const bucket: MonthBucket = {
      monthKey: key,
      label: period.label,
      totalValue: 0,
      perConsultant: {},
      trippings: 0,
      presentations: 0,
      crfSubmissions: 0,
    };
    consultants.forEach((c) => (bucket.perConsultant[c.id] = { count: 0, value: 0 }));
    for (const l of db.leads) {
      if (!verifiedInPeriod(l, period)) continue;
      bucket.totalValue += l.sale_price ?? 0;
      const per = l.assigned_to ? bucket.perConsultant[l.assigned_to] : null;
      if (per) {
        per.count += 1;
        per.value += l.sale_price ?? 0;
      }
    }
    for (const a of db.appointments) {
      if (!inPeriod(a.starts_at, period)) continue;
      if (a.appointment_type === "client_tripping") bucket.trippings += 1;
      else if (
        a.appointment_type === "online_presentation" ||
        a.appointment_type === "actual_presentation"
      ) {
        bucket.presentations += 1;
      }
    }
    for (const l of db.leads) {
      if (isReportableLead(l) && inPeriod(l.crf_submission_date, period))
        bucket.crfSubmissions += 1;
    }
    buckets.push(bucket);
  }
  return buckets;
}

// ---------- Report 3: Lead Source ROI ----------

export interface SourceRoiRow {
  source: LeadSource;
  label: string;
  leadsAdded: number;
  crfReached: number;
  closedSales: number;
  conversionPct: number;
  totalValue: number;
}

export function selectSourceRoi(
  db: DBShape,
  period: Period,
  consultantFilter?: string,
): SourceRoiRow[] {
  const inScope = (l: Lead) =>
    isReportableLead(l) && (!consultantFilter || l.assigned_to === consultantFilter);
  // First-time CRF entries from audit trail
  const firstCrfByLead = new Map<string, AuditEntry>();
  for (const a of db.audit_trail) {
    if (a.type !== "stage_transition" || !a.lead_id) continue;
    const to = (a.meta as { to?: string } | undefined)?.to;
    if (to !== "crf") continue;
    const existing = firstCrfByLead.get(a.lead_id);
    if (!existing || (a.created_at ?? "") < (existing.created_at ?? "")) {
      firstCrfByLead.set(a.lead_id, a);
    }
  }
  const rows: SourceRoiRow[] = LEAD_SOURCES.map((s) => ({
    source: s,
    label: LEAD_SOURCE_LABELS[s],
    leadsAdded: 0,
    crfReached: 0,
    closedSales: 0,
    conversionPct: 0,
    totalValue: 0,
  }));
  const bySource = new Map(rows.map((r) => [r.source, r]));
  for (const l of db.leads) {
    if (!inScope(l)) continue;
    const r = bySource.get(l.source as LeadSource);
    if (!r) continue;
    if (inPeriod(l.date_added, period)) r.leadsAdded += 1;
    const firstCrf = firstCrfByLead.get(l.id);
    if (firstCrf && inPeriod(firstCrf.created_at ?? "", period)) r.crfReached += 1;
    if (verifiedInPeriod(l, period)) {
      r.closedSales += 1;
      r.totalValue += l.sale_price ?? 0;
    }
  }
  for (const r of rows) {
    r.conversionPct = r.leadsAdded > 0 ? (r.closedSales / r.leadsAdded) * 100 : 0;
  }
  return rows;
}

// ---------- Report 4: Activity Volume ----------

export interface ActivityRow {
  consultant: Profile;
  isInactive: boolean;
  leadsOwned: number;
  trippings: number;
  onlinePresentations: number;
  actualPresentations: number;
  totalActivities: number;
  notesLogged: number;
  activityRate: number;
  hasVerifiedSale: boolean;
  trippingsPerSale: number | null;
}

export function selectActivityVolume(db: DBShape, period: Period): ActivityRow[] {
  const consultants = db.profiles.filter((p) => p.role === "property_consultant");
  return consultants.map((c) => {
    const owned = db.leads.filter((l) => l.assigned_to === c.id && isReportableLead(l)).length;
    // Attribute by original performer: appointments carry created_by; leadActivities carry actor_id.
    // Spec: activities credited to the performer. Appointments performer = consultant_id.
    const myApts = db.appointments.filter(
      (a: Appointment) => a.consultant_id === c.id && inPeriod(a.starts_at, period),
    );
    const trippings = myApts.filter((a) => a.appointment_type === "client_tripping").length;
    const onlinePres = myApts.filter((a) => a.appointment_type === "online_presentation").length;
    const actualPres = myApts.filter((a) => a.appointment_type === "actual_presentation").length;
    const notes = db.audit_trail.filter(
      (a) => a.type === "note_added" && a.actor_id === c.id && inPeriod(a.created_at, period),
    ).length;
    const total = trippings + onlinePres + actualPres + notes;
    const verifiedSales = db.leads.filter(
      (l) => l.assigned_to === c.id && verifiedInPeriod(l, period),
    ).length;
    return {
      consultant: c,
      isInactive: !c.is_active,
      leadsOwned: owned,
      trippings,
      onlinePresentations: onlinePres,
      actualPresentations: actualPres,
      totalActivities: total,
      notesLogged: notes,
      activityRate: owned > 0 ? (total / owned) * 100 : 0,
      hasVerifiedSale: verifiedSales > 0,
      trippingsPerSale: verifiedSales > 0 ? trippings / verifiedSales : null,
    };
  });
}
