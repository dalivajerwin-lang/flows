/**
 * Central time source. Business logic (CRF/reservation expiry, undo window)
 * reads pipelineNow() instead of Date.now().
 *
 * NOTE: Clock offset sandbox feature removed in Phase 3 (Supabase migration).
 * Time is always wall-clock time now.
 */

export function pipelineNow(): number {
  return Date.now();
}

export function pipelineNowIso(): string {
  return new Date(pipelineNow()).toISOString();
}
