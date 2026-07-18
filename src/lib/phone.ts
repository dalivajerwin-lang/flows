/**
 * Philippine-focused phone normalization.
 * - Strips spaces, hyphens, parentheses, dots.
 * - Translates local `09XXXXXXXXX` prefix to `+639XXXXXXXXX`.
 * - Returns E.164-ish string ("+" + 10..15 digits).
 */
export function normalizePhone(raw: string): string {
  if (!raw) return "";
  const cleaned = raw.replace(/[\s\-().]/g, "");
  if (!cleaned) return "";
  let out = cleaned;
  if (out.startsWith("00")) out = "+" + out.slice(2);
  if (out.startsWith("09") && !out.startsWith("+")) {
    out = "+63" + out.slice(1);
  } else if (out.startsWith("63") && !out.startsWith("+")) {
    out = "+" + out;
  } else if (!out.startsWith("+") && /^\d+$/.test(out)) {
    // Bare digits — assume already an international body, prepend +
    out = "+" + out;
  }
  return out;
}

export function isValidPhone(normalized: string): boolean {
  if (!normalized) return false;
  const digits = normalized.replace(/[^\d]/g, "");
  return digits.length >= 10 && digits.length <= 15;
}
