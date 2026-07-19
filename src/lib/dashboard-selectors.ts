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
export type AuditEntry = Omit<Database["public"]["Tables"]["audit_trail"]["Row"], "meta"> & {
  meta?: any;
};
export type AuditEntryType = string;
export type CrfExtension = Database["public"]["Tables"]["crf_extensions"]["Row"];
export type TeamGoal = Database["public"]["Tables"]["team_goals"]["Row"];
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

export interface DBShape {
  leads: Lead[];
  profiles: Profile[];
  audit_trail: AuditEntry[];
  crf_extensions: CrfExtension[];
  team_goals: TeamGoal[];
  appointments: Appointment[];
}
import type { Stage } from "@/lib/constants";
import { CRF_WARNING_DAYS, STAGNANT_LEAD_DAYS } from "@/lib/constants";
import { pipelineNow } from "@/lib/pipeline-time";
import { dateKeyManila, manilaParts, manilaDateTimeToIso, ymdOf } from "@/lib/schedule-time";
import { type Period, inPeriod } from "@/lib/reports/time-filter";

export type Scope = { kind: "consultant"; userId: string } | { kind: "team" };

function inScope(l: Lead, scope: Scope): boolean {
  if (l.deleted_at) return false;
  if (scope.kind === "consultant") return l.assigned_to === scope.userId;
  return true;
}

export interface SummaryCounts {
  total: number;
  new_lead: number;
  crf: number;
  reserved: number;
  closed_sale: number; // verified only
  cancelled: number;
}

export function selectSummaryCounts(db: DBShape, scope: Scope, period?: Period): SummaryCounts {
  // Archived leads are hidden from active views — exclude them from all summary numbers.
  // With a period: pipeline stages count leads ADDED in the period (by current stage),
  // closed sales count leads VERIFIED in the period — each stage filtered by the
  // timestamp users actually mean when they pick a date range.
  const leads = db.leads.filter((l) => inScope(l, scope) && l.stage !== "archived");
  let total = 0,
    n_new = 0,
    n_crf = 0,
    n_res = 0,
    n_closed = 0,
    n_cancel = 0;
  for (const l of leads) {
    const createdInPeriod = !period || inPeriod(l.created_at, period);
    if (createdInPeriod) total++;
    if (l.stage === "new_lead" && createdInPeriod) n_new++;
    else if (l.stage === "crf" && createdInPeriod) n_crf++;
    else if (l.stage === "reserved" && createdInPeriod) n_res++;
    else if (
      l.stage === "closed_sale" &&
      l.closed_sale_status === "verified" &&
      (!period || inPeriod(l.closed_sale_verified_at, period))
    )
      n_closed++;
    else if (l.stage === "cancelled" && createdInPeriod) n_cancel++;
  }
  return {
    total,
    new_lead: n_new,
    crf: n_crf,
    reserved: n_res,
    closed_sale: n_closed,
    cancelled: n_cancel,
  };
}

export type StageCounts = Record<Stage, number>;

export function selectStageCounts(db: DBShape, scope: Scope, period?: Period): StageCounts {
  const counts: StageCounts = {
    new_lead: 0,
    crf: 0,
    reserved: 0,
    documentation: 0,
    closed_sale: 0,
    cancelled: 0,
    archived: 0,
  };
  for (const l of db.leads) {
    if (!inScope(l, scope)) continue;
    if (period && !inPeriod(l.created_at, period)) continue;
    counts[l.stage as Stage]++;
  }
  return counts;
}

// -------- Priority items --------

export type PriorityKind =
  "reservation_expiring" | "crf_expiring" | "stagnant" | "awaiting_documentation" | "unassigned";

export interface PriorityItem {
  id: string;
  lead: Lead;
  kind: PriorityKind;
  priorityRank: number; // 1 highest .. 5 lowest
  indicator: string;
  msRemaining: number | null; // for ticking countdowns
}

export function selectPriorityItems(
  db: DBShape,
  scope: Scope,
  opts: { includeUnassigned?: boolean } = {},
): PriorityItem[] {
  const nowMs = pipelineNow();
  const items: PriorityItem[] = [];

  for (const lead of db.leads) {
    if (lead.deleted_at) continue;

    // Unassigned (Manager only, rank 4-top)
    if (opts.includeUnassigned && !lead.assigned_to) {
      items.push({
        id: `un_${lead.id}`,
        lead,
        kind: "unassigned",
        priorityRank: 4,
        indicator: "Unassigned lead",
        msRemaining: null,
      });
      continue;
    }

    if (!inScope(lead, scope)) continue;

    // Rank 1: reservation expiring < 24h — or already expired and still unresolved
    // (an Expired reservation is frozen and is the highest-urgency state per spec).
    if (lead.stage === "reserved" && lead.reservation_expires_at) {
      const ms = new Date(lead.reservation_expires_at).getTime() - nowMs;
      const isExpired = ms <= 0 || lead.reservation_status === "expired";
      if (isExpired) {
        items.push({
          id: `r1_${lead.id}`,
          lead,
          kind: "reservation_expiring",
          priorityRank: 1,
          indicator: "Reservation EXPIRED — resolve to unfreeze",
          msRemaining: 0,
        });
        continue;
      }
      if (ms < 24 * 3600_000) {
        items.push({
          id: `r1_${lead.id}`,
          lead,
          kind: "reservation_expiring",
          priorityRank: 1,
          indicator: "Reservation expiring",
          msRemaining: ms,
        });
        continue;
      }
    }
    // Rank 2: CRF expiring < 3 days
    if (lead.stage === "crf" && lead.crf_expires_at) {
      const ms = new Date(lead.crf_expires_at).getTime() - nowMs;
      const days = ms / 86400_000;
      if (days > 0 && days < CRF_WARNING_DAYS) {
        items.push({
          id: `r2_${lead.id}`,
          lead,
          kind: "crf_expiring",
          priorityRank: 2,
          indicator: `CRF expires in ${Math.max(1, Math.ceil(days))} day${Math.ceil(days) === 1 ? "" : "s"}`,
          msRemaining: ms,
        });
        continue;
      }
    }
    // Rank 3: stagnant (no activity > 7 days) — pipeline stages only
    const activeStages: Stage[] = ["new_lead", "crf", "reserved", "documentation"];
    if (activeStages.includes(lead.stage as Stage)) {
      const ageDays =
        (nowMs - new Date(lead.last_activity_at || lead.updated_at).getTime()) / 86400_000;
      if (ageDays >= STAGNANT_LEAD_DAYS) {
        items.push({
          id: `r3_${lead.id}`,
          lead,
          kind: "stagnant",
          priorityRank: 3,
          indicator: `${Math.floor(ageDays)} days since last contact`,
          msRemaining: null,
        });
        continue;
      }
    }
    // Rank 4: awaiting documentation
    if (lead.stage === "documentation") {
      items.push({
        id: `r4_${lead.id}`,
        lead,
        kind: "awaiting_documentation",
        priorityRank: 4,
        indicator: "Awaiting documentation",
        msRemaining: null,
      });
    }
  }

  items.sort((a, b) => {
    if (a.priorityRank !== b.priorityRank) return a.priorityRank - b.priorityRank;
    // Unassigned pinned to top of rank 4
    if (a.kind === "unassigned" && b.kind !== "unassigned") return -1;
    if (b.kind === "unassigned" && a.kind !== "unassigned") return 1;
    return (
      new Date(a.lead.stage_changed_at).getTime() - new Date(b.lead.stage_changed_at).getTime()
    );
  });

  return items;
}

// -------- Manager pending actions --------

export interface PendingSale {
  lead: Lead;
  agent: Profile | null;
}

export function selectPendingSales(db: DBShape): PendingSale[] {
  return db.leads
    .filter(
      (l) =>
        !l.deleted_at &&
        l.stage === "closed_sale" &&
        l.closed_sale_status === "pending_verification",
    )
    .map((lead) => ({
      lead,
      agent: db.profiles.find((p) => p.id === lead.assigned_to) ?? null,
    }));
}

export function selectEscalatedExpirations(db: DBShape): Lead[] {
  const nowMs = pipelineNow();
  return db.leads.filter((l) => {
    if (l.deleted_at || l.stage !== "reserved" || !l.reservation_expires_at) return false;
    const ms = new Date(l.reservation_expires_at).getTime() - nowMs;
    // Escalate when < 4h remain, and keep escalated once expired but unresolved.
    return ms < 4 * 3600_000 || l.reservation_status === "expired";
  });
}

export function selectPendingCrfExtensions(db: DBShape) {
  return db.crf_extensions.filter((e) => e.status === "pending");
}

// -------- Recent activity --------

export const MILESTONE_TYPES: AuditEntryType[] = [
  "stage_transition",
  "closed_sale_approved",
  "closed_sale_rejected",
  "ownership_transfer",
  "lead_reactivated",
  "auto_cancelled_crf",
  "auto_cancelled_reservation",
  "reservation_frozen",
];

export interface ActivityItem {
  entry: AuditEntry;
  lead: Lead | null;
}

export function selectRecentActivity(
  db: DBShape,
  scope: Scope,
  limit = 10,
  period?: Period,
): ActivityItem[] {
  const relevantLeadIds = new Set(db.leads.filter((l) => inScope(l, scope)).map((l) => l.id));
  return db.audit_trail
    .filter(
      (a) =>
        MILESTONE_TYPES.includes(a.type) &&
        relevantLeadIds.has(a.lead_id ?? "") &&
        (!period || inPeriod(a.created_at, period)),
    )
    .slice()
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, limit)
    .map((entry) => ({
      entry,
      lead: db.leads.find((l) => l.id === entry.lead_id) ?? null,
    }));
}

// -------- Source breakdown --------

export function selectSourceBreakdown(
  db: DBShape,
  scope: Scope,
  period?: Period,
): Array<{ source: string; count: number }> {
  // Default: current month, anchored to the company timezone (Asia/Manila).
  const p = manilaParts(new Date(pipelineNow()));
  const monthStart = new Date(manilaDateTimeToIso(ymdOf(p.year, p.month, 1), "00:00")).getTime();
  const counts = new Map<string, number>();
  for (const l of db.leads) {
    if (!inScope(l, scope)) continue;
    if (period) {
      if (!inPeriod(l.created_at, period)) continue;
    } else if (new Date(l.created_at).getTime() < monthStart) {
      continue;
    }
    counts.set(l.source, (counts.get(l.source) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
}

// -------- Goal / verified sales value --------

function currentMonthKey(): string {
  // yyyy-mm in the company timezone (Asia/Manila).
  return dateKeyManila(new Date(pipelineNow())).slice(0, 7);
}

function prevMonthKey(): string {
  const [y, m] = currentMonthKey().split("-").map(Number);
  const py = m === 1 ? y - 1 : y;
  const pm = m === 1 ? 12 : m - 1;
  return `${py}-${String(pm).padStart(2, "0")}`;
}

function verifiedValueForMonth(db: DBShape, scope: Scope, month: string): number {
  return db.leads
    .filter((l) => {
      if (!inScope(l, scope)) return false;
      if (l.stage !== "closed_sale" || l.closed_sale_status !== "verified") return false;
      // Canonical basis: the Manager's approval timestamp only (blueprint rank-cutoff rule).
      if (!l.closed_sale_verified_at) return false;
      return dateKeyManila(l.closed_sale_verified_at).slice(0, 7) === month;
    })
    .reduce((sum, l) => sum + (l.sale_price ?? 0), 0);
}

export function selectVerifiedSalesValue(db: DBShape, scope: Scope, period?: Period): number {
  if (period) {
    return db.leads
      .filter((l) => {
        if (!inScope(l, scope)) return false;
        if (l.stage !== "closed_sale" || l.closed_sale_status !== "verified") return false;
        return inPeriod(l.closed_sale_verified_at, period);
      })
      .reduce((sum, l) => sum + (l.sale_price ?? 0), 0);
  }
  return verifiedValueForMonth(db, scope, currentMonthKey());
}

export function selectPrevMonthVerifiedValue(db: DBShape, scope: Scope): number {
  return verifiedValueForMonth(db, scope, prevMonthKey());
}

export function selectPendingSalesValue(db: DBShape, scope: Scope): number {
  return db.leads
    .filter(
      (l) =>
        inScope(l, scope) &&
        l.stage === "closed_sale" &&
        l.closed_sale_status === "pending_verification",
    )
    .reduce((sum, l) => sum + (l.sale_price ?? 0), 0);
}

export function selectTeamGoal(db: DBShape): number | null {
  const month = currentMonthKey();
  return db.team_goals.find((g) => g.month === month)?.target_amount ?? null;
}

export function selectPersonalTarget(
  db: DBShape,
  userId: string,
): { amount: number; auto: boolean } {
  const profile = db.profiles.find((p) => p.id === userId);
  if (profile && profile.personal_monthly_target > 0) {
    return { amount: profile.personal_monthly_target, auto: false };
  }
  const team = selectTeamGoal(db);
  const active = db.profiles.filter((p) => p.role === "property_consultant" && p.is_active).length;
  return { amount: team && active ? Math.round(team / active) : 0, auto: true };
}

// -------- Team overview --------

export interface TeamRow {
  consultant: Profile;
  activeLeads: number;
  trippingsThisWeek: number;
  presentationsThisWeek: number;
  closedCount: number;
  closedValue: number;
  lastLogin: string | null;
}

function weekBoundsManila(): { start: number; end: number } {
  // Monday 00:00 – next Monday 00:00, anchored to Asia/Manila regardless of device timezone.
  const p = manilaParts(new Date(pipelineNow()));
  // Day-of-week of the current Manila date (Mon=0). Use a UTC-noon date to avoid DST/rollover.
  const anchor = new Date(Date.UTC(p.year, p.month - 1, p.day, 12));
  const daysFromMonday = (anchor.getUTCDay() + 6) % 7;
  anchor.setUTCDate(anchor.getUTCDate() - daysFromMonday);
  const mondayKey = ymdOf(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, anchor.getUTCDate());
  const start = new Date(manilaDateTimeToIso(mondayKey, "00:00")).getTime();
  return { start, end: start + 7 * 86400_000 };
}

export function selectTeamOverview(db: DBShape): TeamRow[] {
  const { start, end } = weekBoundsManila();
  const consultants = db.profiles.filter((p) => p.role === "property_consultant");
  return consultants.map((c) => {
    const myLeads = db.leads.filter((l) => l.assigned_to === c.id && !l.deleted_at);
    const activeStages: Stage[] = ["new_lead", "crf", "reserved", "documentation"];
    const activeLeads = myLeads.filter((l) => activeStages.includes(l.stage as Stage)).length;
    const apts = db.appointments.filter((a) => {
      const t = new Date(a.starts_at).getTime();
      return a.consultant_id === c.id && t >= start && t < end;
    });
    const trippings = apts.filter((a) => a.appointment_type === "client_tripping").length;
    const presentations = apts.filter(
      (a) =>
        a.appointment_type === "online_presentation" ||
        a.appointment_type === "actual_presentation",
    ).length;
    const closedThisMonth = myLeads.filter(
      (l) =>
        l.stage === "closed_sale" &&
        l.closed_sale_status === "verified" &&
        l.closed_sale_verified_at &&
        dateKeyManila(l.closed_sale_verified_at).slice(0, 7) === currentMonthKey(),
    );
    return {
      consultant: c,
      activeLeads,
      trippingsThisWeek: trippings,
      presentationsThisWeek: presentations,
      closedCount: closedThisMonth.length,
      closedValue: closedThisMonth.reduce((sum, l) => sum + (l.sale_price ?? 0), 0),
      lastLogin: c.last_login_at,
    };
  });
}
