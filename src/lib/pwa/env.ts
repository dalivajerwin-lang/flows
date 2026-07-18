/**
 * PWA environment helpers — device detection, install state, session counter.
 * All client-only. Guard `typeof window` at every entry point.
 */

const SESSION_COUNT_KEY = "tenacious.pwa.sessions";
const SESSION_MARKED_KEY = "tenacious.pwa.session-marked"; // sessionStorage

export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function isIOSSafari(): boolean {
  if (!isBrowser()) return false;
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
  return isIOS && isSafari;
}

export function isStandalone(): boolean {
  if (!isBrowser()) return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/**
 * Increment a persistent session counter, but only once per browser session
 * (sessionStorage flag prevents double-count during hot reloads / SPA nav).
 * Returns the total number of sessions this browser has completed.
 */
export function markSessionAndCount(): number {
  if (!isBrowser()) return 0;
  const already = window.sessionStorage.getItem(SESSION_MARKED_KEY);
  const prev = Number(window.localStorage.getItem(SESSION_COUNT_KEY) ?? "0") || 0;
  if (already) return prev;
  const next = prev + 1;
  window.localStorage.setItem(SESSION_COUNT_KEY, String(next));
  window.sessionStorage.setItem(SESSION_MARKED_KEY, "1");
  return next;
}

export function getSessionCount(): number {
  if (!isBrowser()) return 0;
  return Number(window.localStorage.getItem(SESSION_COUNT_KEY) ?? "0") || 0;
}
