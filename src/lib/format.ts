import { CURRENCY_SYMBOL, NOTIFICATION_BADGE_MAX } from "./constants";

export function formatCurrency(amount: number): string {
  return `${CURRENCY_SYMBOL}${amount.toLocaleString("en-PH")}`;
}

export function formatBadgeCount(n: number): string {
  if (n <= 0) return "";
  if (n > NOTIFICATION_BADGE_MAX) return `${NOTIFICATION_BADGE_MAX}+`;
  return String(n);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function formatCountdown(msRemaining: number): string {
  if (msRemaining <= 0) return "Expired";
  const totalSeconds = Math.floor(msRemaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
