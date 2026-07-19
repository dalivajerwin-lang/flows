/**
 * Onboarding store — optimistic local step state with background writes to
 * `profiles.onboarding` (jsonb). Mirrors auth-store conventions: Zustand,
 * `db.from("profiles").update(...)` self-writes (RLS `profiles_update_own`).
 *
 * Step transitions never wait on the network (§7 per-step persistence):
 * mutations update local state synchronously, then persist fire-and-forget.
 */
import { create } from "zustand";
import { db } from "@/lib/supabase";
import { useAuth } from "./auth-store";
import {
  emptyOnboardingState,
  firstIncompleteIndex,
  journeyRoleFor,
  parseOnboarding,
  stepsFor,
  type OnboardingState,
  type StepStatus,
} from "@/lib/onboarding-config";

interface OnboardingStoreState {
  state: OnboardingState | null;
  /** Index of the step currently on screen. */
  stepIndex: number;
  /** Begin (or resume) the flow for the current profile. */
  start: () => void;
  goTo: (index: number) => void;
  back: () => void;
  /** Mark the current step done/skipped, award XP, and advance. */
  advance: (status: Exclude<StepStatus, null>) => void;
  awardBadge: (badgeId: string) => boolean;
  /** Record arbitrary partial updates (firstDay ticks, dismissals). */
  patch: (partial: Partial<OnboardingState>) => void;
  /** Exit the whole flow ("Finish later", §7): sets skippedAt. */
  exitFlow: () => void;
  /** Finish the flow: sets completedAt. */
  complete: () => void;
}

/** Persist the onboarding blob: sync the cached auth profile immediately
 * (login-redirect checks must never see stale state), then write-behind. */
function persist(state: OnboardingState) {
  const { userId, profile } = useAuth.getState();
  if (!userId) return;
  if (profile && profile.id === userId) {
    useAuth.setState({ profile: { ...profile, onboarding: state } as unknown as typeof profile });
  }
  db.from("profiles")
    .update({ onboarding: state, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .then(() => {})
    .catch(() => {
      /* optimistic — a later write will converge */
    });
}

export const useOnboarding = create<OnboardingStoreState>((set, get) => ({
  state: null,
  stepIndex: 0,

  start: () => {
    const profile = useAuth.getState().profile;
    if (!profile) return;
    const existing = parseOnboarding((profile as { onboarding?: unknown }).onboarding);
    if (existing && existing.completedAt == null) {
      // Resume at the first incomplete step; clear a previous "finish later" exit.
      const resumed: OnboardingState = { ...existing, skippedAt: null };
      set({ state: resumed, stepIndex: firstIncompleteIndex(resumed) });
      if (existing.skippedAt != null) persist(resumed);
      return;
    }
    const fresh = emptyOnboardingState(journeyRoleFor(profile.role));
    set({ state: fresh, stepIndex: 0 });
    persist(fresh);
  },

  goTo: (index) => {
    const { state } = get();
    if (!state) return;
    const max = stepsFor(state.role).length - 1;
    set({ stepIndex: Math.max(0, Math.min(index, max)) });
  },

  back: () => set((s) => ({ stepIndex: Math.max(0, s.stepIndex - 1) })),

  advance: (status) => {
    const { state, stepIndex } = get();
    if (!state) return;
    const steps = stepsFor(state.role);
    const step = steps[stepIndex];
    if (!step) return;
    // Skipped steps earn 0 XP but still advance progress (§3.1).
    // Re-completing a previously done/skipped step never double-awards.
    const alreadyDone = state.steps[step.id] === "done";
    const xpGain = status === "done" && !alreadyDone ? step.xp : 0;
    const next: OnboardingState = {
      ...state,
      steps: { ...state.steps, [step.id]: alreadyDone ? "done" : status },
      xp: Math.min(100, state.xp + xpGain),
    };
    set({ state: next, stepIndex: Math.min(stepIndex + 1, steps.length - 1) });
    persist(next);
  },

  awardBadge: (badgeId) => {
    const { state } = get();
    if (!state || state.badges.includes(badgeId)) return false;
    const next = { ...state, badges: [...state.badges, badgeId] };
    set({ state: next });
    persist(next);
    return true;
  },

  patch: (partial) => {
    const { state } = get();
    if (!state) return;
    const next = { ...state, ...partial };
    set({ state: next });
    persist(next);
  },

  exitFlow: () => {
    const { state } = get();
    if (!state) return;
    const next = { ...state, skippedAt: new Date().toISOString() };
    set({ state: next });
    persist(next);
  },

  complete: () => {
    const { state } = get();
    if (!state) return;
    const badges = state.badges.includes("day_one") ? state.badges : [...state.badges, "day_one"];
    const next: OnboardingState = {
      ...state,
      badges,
      xp: 100,
      completedAt: new Date().toISOString(),
    };
    set({ state: next });
    persist(next);
  },
}));
