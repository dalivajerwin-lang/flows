import { toast } from "sonner";

/**
 * Safe localStorage wrapper for UI-only fallback persistence.
 *
 * - Every write is try/catch-wrapped.
 * - On `QuotaExceededError`, fires a one-shot recovery toast.
 * - On JSON.parse failure at read time, backs up the raw value to a
 *   `<key>_corrupt` sibling key, resets to the provided fallback,
 *   and fires a notice — never boot-loops.
 */

let quotaToastFired = false;

export function safeSet(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (err) {
    // Chrome/Safari signal quota as DOMException named QuotaExceededError.
    // Firefox uses NS_ERROR_DOM_QUOTA_REACHED (code 1014).
    const isQuota =
      err instanceof DOMException &&
      (err.name === "QuotaExceededError" ||
        err.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
        err.code === 22 ||
        err.code === 1014);
    if (isQuota && !quotaToastFired) {
      quotaToastFired = true;
      toast.error("Local storage is full", {
        description:
          "Clear local app data from your browser settings, then reload. Uploaded images may be too large - captures are compressed to <=800px, but old local data can still fill the quota.",
        duration: 10000,
      });
    } else if (!isQuota) {
      console.error("[safe-storage] setItem failed", key, err);
    }
    return false;
  }
}

export function safeRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch (err) {
    console.error("[safe-storage] removeItem failed", key, err);
  }
}

/**
 * Read a JSON value. On parse failure, backs up the raw string to
 * `${key}_corrupt`, removes the primary key, and returns `fallback`.
 * Boot code can then reset without looping.
 */
export function safeGetJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error("[safe-storage] JSON parse failed for", key, err);
    try {
      window.localStorage.setItem(`${key}_corrupt`, raw);
      window.localStorage.removeItem(key);
    } catch {
      // best-effort; if this also fails we still return the fallback.
    }
    // Deferred so the toast host has mounted before this fires during boot.
    setTimeout(() => {
      toast("Recovered from corrupt local data", {
        description: `Backed up "${key}" to "${key}_corrupt" and reset local fallback data.`,
      });
    }, 500);
    return fallback;
  }
}

export function safeSetJSON<T>(key: string, value: T): boolean {
  try {
    return safeSet(key, JSON.stringify(value));
  } catch (err) {
    console.error("[safe-storage] stringify failed for", key, err);
    return false;
  }
}
