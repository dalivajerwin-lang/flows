import { Button } from "@/components/ui/tenacious-button";
import { useCurrentProfile } from "@/stores/auth-store";
import {
  BADGES,
  firstDayItemsFor,
  type OnboardingRole,
  type OnboardingState,
} from "@/lib/onboarding-config";
import { Confetti } from "./confetti";
import { BadgeCircle, XpCounter } from "./onboarding-bits";

/**
 * Finish — C6 / M7. Dark full-bleed bookend (matching C1/M1), confetti once
 * ever, XP roll-up, badge recap with staggered pops, first-day preview.
 * Reduced motion: confetti never renders (handled inside <Confetti/>) and the
 * global kill rule collapses the stagger.
 */
export function StepFinish({
  journeyRole,
  state,
  inviteCount,
  onOpenDashboard,
}: {
  journeyRole: OnboardingRole;
  state: OnboardingState;
  inviteCount: number;
  onOpenDashboard: () => void;
}) {
  const profile = useCurrentProfile();
  const first = profile?.display_name.split(" ")[0] ?? "there";
  const isConsultant = journeyRole === "property_consultant";
  // Day One is awarded on complete(); show it in the recap regardless of ordering.
  const badges = state.badges.includes("day_one") ? state.badges : [...state.badges, "day_one"];
  const firstDay = firstDayItemsFor(journeyRole);

  return (
    <div
      data-onb-welcome
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[var(--color-sidebar)] px-6 text-center"
      style={{
        paddingTop: "max(2.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <Confetti />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-1/2 top-1/2 h-[420px] w-[420px] max-w-[100vw] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(6,148,148,0.22) 0%, rgba(6,148,148,0.06) 45%, transparent 70%)",
        }}
      />

      {/* m-auto: centered when content fits, scrollable from the top when it
          doesn't (small phones / landscape) — justify-center would clip. */}
      <div className="m-auto flex w-full flex-col items-center">
        <h1
          className="relative max-w-md text-2xl font-bold leading-tight text-white sm:text-[28px]"
          style={{ animation: "onb-rise 450ms ease-out 150ms both" }}
        >
          {isConsultant ? <>You're ready, {first}!</> : <>Your workspace is live, {first}!</>}
        </h1>

        <div
          className="relative mt-4 text-sm font-semibold text-[var(--color-primary)]"
          style={{ animation: "onb-rise 450ms ease-out 300ms both" }}
        >
          <XpCounter value={100} className="text-2xl" /> XP
        </div>

        {!isConsultant && inviteCount > 0 && (
          <p
            className="relative mt-2 text-sm text-white/60"
            style={{ animation: "onb-rise 450ms ease-out 380ms both" }}
          >
            {inviteCount} invite{inviteCount === 1 ? "" : "s"} ready — you'll be notified when they
            join.
          </p>
        )}

        {/* Earned badges line up with staggered pops, 120ms apart (§4 C6). */}
        <div className="relative mt-6 flex flex-wrap items-center justify-center gap-4">
          {badges.map((id, i) => (
            <div
              key={id}
              className="flex flex-col items-center gap-1.5"
              style={{ animation: `onb-rise 400ms ease-out ${500 + i * 120}ms both` }}
            >
              <BadgeCircle badgeId={id} size={48} pop />
              <span className="text-[11px] font-medium text-white/70">{BADGES[id]?.name}</span>
            </div>
          ))}
        </div>

        {/* "Your first day" mini-checklist preview (§10). */}
        <div
          className="relative mt-8 w-full max-w-sm rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-4 text-left"
          style={{ animation: "onb-rise 450ms ease-out 700ms both" }}
        >
          <div className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Your first day
          </div>
          <ul className="mt-2 space-y-1.5">
            {firstDay.map((item, i) => (
              <li key={item.id} className="flex items-start gap-2 text-sm text-white/80">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--color-primary)]/20 text-[10px] font-semibold text-[var(--color-primary)]">
                  {i + 1}
                </span>
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative" style={{ animation: "onb-rise 450ms ease-out 900ms both" }}>
          <Button onClick={onOpenDashboard} className="mt-8 min-w-[220px] text-base">
            Open my dashboard
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes onb-rise {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-onb-welcome] * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
        }
      `}</style>
    </div>
  );
}
