import { CURRENCY_SYMBOL } from "./constants";
import { formatCurrency } from "./format";

/**
 * Compact peso format:
 *   ≥ 1,000,000  → ₱18.5M (1 decimal, trim trailing .0)
 *   ≥ 10,000     → ₱600K  (rounded to whole thousands)
 *   < 10,000     → ₱9,500 (full with commas)
 */
export function compactPeso(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return "—";
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1_000_000) {
    const v = amount / 1_000_000;
    const s = (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, "");
    return `${sign}${CURRENCY_SYMBOL}${s.replace("-", "")}M`;
  }
  if (abs >= 10_000) {
    const v = Math.round(amount / 1000);
    return `${CURRENCY_SYMBOL}${v}K`;
  }
  return formatCurrency(amount);
}

export function exactPeso(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return "—";
  return formatCurrency(amount);
}
