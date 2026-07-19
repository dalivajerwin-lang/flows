import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { X, ArrowRight } from "lucide-react";
import { useAuth, useCurrentProfile, type Profile } from "@/stores/auth-store";
import { db } from "@/lib/supabase";
import {
  firstDayItemsFor,
  isOnboardingIncomplete,
  parseOnboarding,
  progressPercent,
  remainingSteps,
  type OnboardingState,
} from "@/lib/onboarding-config";
import { CheckDraw } from "./onboarding-bits";
import { cn } from "@/lib/utils";
import "./onboarding.css";

/** Patch the persisted onboarding blob from outside the flow (dashboard widgets). */
function persistOnboarding(profile: Profile, next: OnboardingState) {
  useAuth.setState({ profile: { ...profile, onboarding: next } as unknown as Profile });
  db.from("profiles")
    .update({ onboarding: next, updated_at: new Date().toISOString() })
    .eq("id", profile.id)
    .then(() => {})
    .catch(() => {});
}

/**
 * Resume banner (§7 "the way back") — shown on the dashboard when the user
 * exited onboarding early ("Finish later"). Progress ring + remaining count +
 * honest remaining-time estimate (~90s per step budget). Dismissable forever.
 */
export function ResumeOnboardingBanner() {
  const profile = useCurrentProfile();
  const navigate = useNavigate();
  if (!profile || profile.role === "superadmin") return null;
  const raw = (profile as { onboarding?: unknown }).onboarding;
  if (!isOnboardingIncomplete(raw)) return null;
  const state = parseOnboarding(raw)!;
  const left = remainingSteps(state);
  const pct = progressPercent(state);
  const secondsLeft = left * 90;
  const timeLabel =
    secondsLeft >= 120 ? `~${Math.round(secondsLeft / 60)} minutes` : `~${secondsLeft} seconds`;

  return (
    <div className="flex items-center gap-3 rounded-(--radius-md) border border-(--color-primary-light) bg-(--color-primary-light)/40 p-3">
      {/* Progress ring */}
      <svg width="40" height="40" viewBox="0 0 40 40" className="shrink-0 -rotate-90">
        <circle cx="20" cy="20" r="16" fill="none" stroke="var(--color-border)" strokeWidth="4" />
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 100.5} 100.5`}
        />
      </svg>
      <button
        type="button"
        onClick={() => navigate({ to: "/onboarding" })}
        className="min-w-0 flex-1 text-left"
      >
        <div className="text-sm font-semibold text-(--color-text)">
          Finish setting up — {left} step{left === 1 ? "" : "s"} left ({timeLabel})
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-xs font-medium text-(--color-primary)">
          Pick up where you left off <ArrowRight className="h-3 w-3" />
        </div>
      </button>
      <button
        type="button"
        aria-label="Dismiss setup reminder"
        onClick={() => persistOnboarding(profile, { ...state, resumeBannerDismissed: true })}
        className="shrink-0 rounded-full p-1.5 text-(--color-text-secondary) transition-tenacious hover:bg-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * "Your first day" checklist (§10.1) — persistent, dismissable dashboard card
 * shown after onboarding completes, with role-specific items. Completing all
 * three earns a final quiet toast (streak seed, not a streak system).
 */
export function FirstDayChecklist() {
  const profile = useCurrentProfile();
  const navigate = useNavigate();
  if (!profile || profile.role === "superadmin") return null;
  const state = parseOnboarding((profile as { onboarding?: unknown }).onboarding);
  if (!state || state.completedAt == null || state.firstDayDismissed) return null;
  const items = firstDayItemsFor(state.role);
  const done = state.firstDay ?? {};
  if (items.every((i) => done[i.id])) return null;

  const tick = (id: string, to: string) => {
    const nextDone = { ...done, [id]: true };
    persistOnboarding(profile, { ...state, firstDay: nextDone });
    if (items.every((i) => nextDone[i.id])) {
      toast("Day one: done. See you tomorrow.");
    }
    navigate({ to });
  };

  return (
    <div className="rounded-(--radius-md) border border-(--color-border) bg-white p-4 shadow-(--shadow-sm)">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-(--color-text)">Your first day</h2>
        <button
          type="button"
          aria-label="Dismiss first-day checklist"
          onClick={() => persistOnboarding(profile, { ...state, firstDayDismissed: true })}
          className="rounded-full p-1 text-(--color-text-secondary) transition-tenacious hover:bg-(--color-surface)"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((item) => {
          const isDone = !!done[item.id];
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => !isDone && tick(item.id, item.to)}
                disabled={isDone}
                className={cn(
                  "flex w-full items-center gap-3 rounded-(--radius-sm) p-2 text-left text-sm transition-tenacious",
                  isDone
                    ? "text-(--color-text-secondary)"
                    : "text-(--color-text) hover:bg-(--color-surface)",
                )}
              >
                <span
                  className={cn(
                    "grid h-6 w-6 shrink-0 place-items-center rounded-full border",
                    isDone
                      ? "border-(--color-primary) bg-(--color-primary-light)"
                      : "border-(--color-border)",
                  )}
                >
                  {isDone && <CheckDraw size={14} />}
                </span>
                <span className={cn(isDone && "line-through")}>{item.label}</span>
                {!isDone && (
                  <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-(--color-text-placeholder)" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Blur-to-focus dashboard reveal (§9.5) — a one-time overlay that resolves the
 * freshly-built dashboard to sharp over 500ms after the finish CTA. Armed by a
 * sessionStorage flag set on onboarding completion; unmounts after 700ms.
 */
const REVEAL_KEY = "tenacious.onboarding.reveal";

export function OnboardingRevealOverlay() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let armed = false;
    try {
      armed = window.sessionStorage.getItem(REVEAL_KEY) === "1";
      if (armed) window.sessionStorage.removeItem(REVEAL_KEY);
    } catch {
      /* ignore */
    }
    if (!armed) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 700);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;
  return (
    <div
      aria-hidden="true"
      className="onb-focus-reveal pointer-events-none fixed inset-0 z-40 bg-white/30"
    />
  );
}
