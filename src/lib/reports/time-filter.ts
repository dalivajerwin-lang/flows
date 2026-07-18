/**
 * Shared time-filter utility for Reports & Leaderboard.
 * All periods are computed in Asia/Manila (UTC+8, no DST).
 *
 * A "period" is a UTC millisecond window [startMs, endMs) which corresponds to
 * a full calendar week / month in Manila local time.
 */
import { pipelineNow } from "@/lib/pipeline-time";

export const MANILA_OFFSET_MS = 8 * 3600_000;

export type PeriodKind = "week" | "month" | "all";

export interface Period {
  kind: PeriodKind;
  /** UTC ms inclusive lower bound. -Infinity for "all". */
  startMs: number;
  /** UTC ms exclusive upper bound. +Infinity for "all". */
  endMs: number;
  /** Human label like "This Week", "July 2026", "All Time". */
  label: string;
  /** For "month" kind: YYYY-MM. */
  monthKey?: string;
}

/** Extract Manila-local calendar parts for a UTC ms instant. */
export function manilaParts(ms: number) {
  const d = new Date(ms + MANILA_OFFSET_MS);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(), // 0-11
    day: d.getUTCDate(),
    weekday: d.getUTCDay(), // 0 = Sunday .. 6 = Saturday
  };
}

/** UTC ms corresponding to Manila-local midnight of the given calendar date. */
export function manilaMidnightUtc(year: number, month: number, day: number): number {
  return Date.UTC(year, month, day) - MANILA_OFFSET_MS;
}

/** This week in Manila: Monday 00:00 → next Monday 00:00. */
export function weekPeriod(nowMs = pipelineNow()): Period {
  const { year, month, day, weekday } = manilaParts(nowMs);
  const daysFromMonday = (weekday + 6) % 7; // Mon=0, Sun=6
  const start = manilaMidnightUtc(year, month, day - daysFromMonday);
  const end = start + 7 * 86400_000;
  return { kind: "week", startMs: start, endMs: end, label: "This Week" };
}

/** Monthly period for a specific YYYY-MM (Manila). Defaults to current month. */
export function monthPeriod(monthKey?: string, nowMs = pipelineNow()): Period {
  let y: number, m: number;
  if (monthKey) {
    const [ys, ms] = monthKey.split("-");
    y = Number(ys);
    m = Number(ms) - 1;
  } else {
    const p = manilaParts(nowMs);
    y = p.year;
    m = p.month;
  }
  const start = manilaMidnightUtc(y, m, 1);
  const end = manilaMidnightUtc(y, m + 1, 1);
  const label = new Date(Date.UTC(y, m, 1)).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const key = `${y}-${String(m + 1).padStart(2, "0")}`;
  return { kind: "month", startMs: start, endMs: end, label, monthKey: key };
}

export function allTimePeriod(): Period {
  return { kind: "all", startMs: -Infinity, endMs: Infinity, label: "All Time" };
}

export function currentMonthKey(nowMs = pipelineNow()): string {
  const { year, month } = manilaParts(nowMs);
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function inPeriod(iso: string | null | undefined, period: Period): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= period.startMs && t < period.endMs;
}

/** The period immediately before the given one (null for "all" — nothing to compare). */
export function prevPeriod(period: Period): Period | null {
  if (period.kind === "week") {
    return {
      kind: "week",
      startMs: period.startMs - 7 * 86400_000,
      endMs: period.startMs,
      label: "Last Week",
    };
  }
  if (period.kind === "month" && period.monthKey) {
    return monthPeriod(shiftMonthKey(period.monthKey, -1));
  }
  return null;
}

/** Compact YYYY-MM for a given Manila-local month offset from a reference month. */
export function shiftMonthKey(key: string, delta: number): string {
  const [ys, ms] = key.split("-");
  const y = Number(ys);
  const m = Number(ms) - 1 + delta;
  const d = new Date(Date.UTC(y, m, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
