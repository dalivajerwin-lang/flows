import { Button } from "@/components/ui/tenacious-button";
import { useCurrentProfile } from "@/stores/auth-store";
import { stepsFor, type OnboardingRole } from "@/lib/onboarding-config";

/**
 * Welcome — C1 / M1. Full-bleed dark bookend matching the splash screen
 * (#111827 + teal glow + splash keyframes, which are global by the time this
 * mounts... they are not — splash keyframes live in a <style> block in
 * splash-screen.tsx — so this screen carries its own copies).
 */
export function StepWelcome({
  journeyRole,
  onContinue,
}: {
  journeyRole: OnboardingRole;
  onContinue: () => void;
}) {
  const profile = useCurrentProfile();
  const first = profile?.display_name.split(" ")[0] ?? "there";
  const isConsultant = journeyRole === "property_consultant";
  // Preview chips: the steps after this one, minus the finish bookend's chip count nuance —
  // consultant previews "5 things", manager previews the 6 remaining steps (§4 C1 / §5 M1).
  const chips = stepsFor(journeyRole)
    .slice(1)
    .map((s) => s.label);

  return (
    <div
      data-onb-welcome
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[var(--color-sidebar)] px-6 text-center"
      style={{
        paddingTop: "max(2rem, env(safe-area-inset-top))",
        paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-1/2 top-1/2 h-[420px] w-[420px] max-w-[100vw] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(6,148,148,0.22) 0%, rgba(6,148,148,0.06) 45%, transparent 70%)",
          animation: "onb-glow 1600ms ease-in-out infinite alternate",
        }}
      />

      {/* m-auto centers when there's room but never clips on short screens
          (justify-center would push the top content out of reach). */}
      <div className="m-auto flex w-full flex-col items-center">
        <div
          className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[22.5%] shadow-[0_8px_32px_rgba(0,0,0,0.45)] ring-1 ring-white/10"
          style={{ animation: "onb-icon-in 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both" }}
        >
          <img src="/icons/icon-512.png" alt="" className="h-full w-full object-cover" />
        </div>

        <h1
          className="mt-6 max-w-md text-2xl font-bold leading-tight text-white sm:text-[28px]"
          style={{ animation: "onb-rise 450ms ease-out 150ms both" }}
        >
          Welcome to Team Tenacious, {first}.
        </h1>
        <p
          className="mt-3 max-w-sm text-sm text-white/60 sm:text-[15px]"
          style={{ animation: "onb-rise 450ms ease-out 250ms both" }}
        >
          {isConsultant ? (
            <>
              Your manager already set up your seat. You're a{" "}
              <strong className="text-white/85">Property Consultant</strong> — let's get you selling
              in about 4 minutes.
            </>
          ) : (
            <>
              You're set up as a <strong className="text-white/85">Manager</strong>. Let's build
              your workspace — about 6 minutes.
            </>
          )}
        </p>

        {/* Step chips stagger in left-to-right, 60ms apart (§4 C1). */}
        <div className="mt-6 flex max-w-md flex-wrap items-center justify-center gap-2">
          {chips.map((label, i) => (
            <span
              key={label}
              className="rounded-[var(--radius-pill)] border border-white/15 px-3 py-1 text-xs font-medium text-white/70"
              style={{ animation: `onb-rise 400ms ease-out ${400 + i * 60}ms both` }}
            >
              {label}
            </span>
          ))}
        </div>

        <div style={{ animation: "onb-rise 450ms ease-out 800ms both" }}>
          <Button onClick={onContinue} className="mt-10 min-w-[200px] text-base">
            Let's go
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes onb-icon-in {
          from { opacity: 0; transform: scale(0.7); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes onb-rise {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes onb-glow {
          from { opacity: 0.7; transform: translate(-50%, -50%) scale(0.9); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-onb-welcome] * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
        }
      `}</style>
    </div>
  );
}
