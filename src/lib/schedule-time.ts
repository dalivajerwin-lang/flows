// All schedule time math anchored to Asia/Manila.
export const TZ = "Asia/Manila";

const ymdFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export interface ManilaParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
}

export function manilaParts(iso: string | Date): ManilaParts {
  const d = iso instanceof Date ? iso : new Date(iso);
  const parts = partsFormatter.formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") === 24 ? 0 : get("hour"),
    minute: get("minute"),
  };
}

/** yyyy-mm-dd for the given ISO in Asia/Manila. */
export function dateKeyManila(iso: string | Date): string {
  const d = iso instanceof Date ? iso : new Date(iso);
  return ymdFormatter.format(d);
}

export function todayKeyManila(): string {
  return dateKeyManila(new Date());
}

export function tomorrowKeyManila(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return dateKeyManila(d);
}

/** Format a time range like "9:00 AM – 11:00 AM" using Manila timezone. */
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});
export function formatManilaTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}
export function formatManilaTimeRange(start: string, end: string): string {
  return `${formatManilaTime(start)} – ${formatManilaTime(end)}`;
}

/** Long weekday date: "Friday, Jul 24". */
const longDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  weekday: "long",
  month: "short",
  day: "numeric",
});
export function formatManilaLongDate(iso: string | Date): string {
  const d = iso instanceof Date ? iso : new Date(iso);
  return longDateFormatter.format(d);
}

const fullDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});
export function formatManilaFullDate(iso: string | Date): string {
  const d = iso instanceof Date ? iso : new Date(iso);
  return fullDateFormatter.format(d);
}

/** Group heading for a date key. */
export function dateGroupLabel(key: string): string {
  if (key === todayKeyManila()) return "Today";
  if (key === tomorrowKeyManila()) return "Tomorrow";
  // key is yyyy-mm-dd — construct a stable date to format
  const [y, m, d] = key.split("-").map(Number);
  const iso = new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).toISOString();
  return formatManilaLongDate(iso);
}

/** Return yyyy-mm-dd for a Date treated as literal calendar day. */
export function ymdOf(y: number, m1: number, d: number): string {
  const mm = String(m1).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

/** Iterate the month grid (Monday-first, 42 cells) for a given yyyy-mm. */
export function monthGridDays(
  year: number,
  month1: number,
): { key: string; day: number; inMonth: boolean }[] {
  // JS Date getUTCDay: 0=Sun..6=Sat. Convert to Monday=0.
  const first = new Date(Date.UTC(year, month1 - 1, 1));
  const firstDow = (first.getUTCDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(Date.UTC(year, month1, 0)).getUTCDate();
  const cells: { key: string; day: number; inMonth: boolean }[] = [];
  // Leading days from previous month
  const prevMonthDays = new Date(Date.UTC(year, month1 - 1, 0)).getUTCDate();
  for (let i = firstDow - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const prevMonth = month1 === 1 ? 12 : month1 - 1;
    const prevYear = month1 === 1 ? year - 1 : year;
    cells.push({ key: ymdOf(prevYear, prevMonth, day), day, inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ key: ymdOf(year, month1, d), day: d, inMonth: true });
  }
  while (cells.length < 42) {
    const idx = cells.length - firstDow - daysInMonth + 1;
    const nextMonth = month1 === 12 ? 1 : month1 + 1;
    const nextYear = month1 === 12 ? year + 1 : year;
    cells.push({ key: ymdOf(nextYear, nextMonth, idx), day: idx, inMonth: false });
  }
  return cells;
}

/** Days of a Monday-first week containing the given yyyy-mm-dd. */
export function weekDays(anchorKey: string): string[] {
  const [y, m, d] = anchorKey.split("-").map(Number);
  const anchor = new Date(Date.UTC(y, m - 1, d));
  const dow = (anchor.getUTCDay() + 6) % 7; // Mon=0
  const monday = new Date(anchor);
  monday.setUTCDate(anchor.getUTCDate() - dow);
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const dt = new Date(monday);
    dt.setUTCDate(monday.getUTCDate() + i);
    out.push(ymdOf(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()));
  }
  return out;
}

/** Combine a yyyy-mm-dd + HH:MM local Manila to an ISO. Manila is UTC+8, no DST. */
export function manilaDateTimeToIso(dateKey: string, hhmm: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [h, min] = hhmm.split(":").map(Number);
  // Manila = UTC+8 → the UTC time is 8h earlier.
  return new Date(Date.UTC(y, m - 1, d, h - 8, min, 0)).toISOString();
}

/** Return HH:MM Manila from ISO for form editing. */
export function isoToManilaHhmm(iso: string): string {
  const p = manilaParts(iso);
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

/** True if start >= now and start <= now + 24h. */
export function within24Hours(iso: string): boolean {
  const t = new Date(iso).getTime();
  const n = Date.now();
  return t >= n && t <= n + 24 * 3600_000;
}
