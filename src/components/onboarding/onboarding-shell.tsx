import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/tenacious-button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentProfile } from "@/stores/auth-store";
import { initials } from "@/lib/format";
import { encouragementFor } from "@/lib/onboarding-config";
import { XpCounter } from "./onboarding-bits";
import { cn } from "@/lib/utils";

/**
 * OnboardingShell — shared chrome for every card step (§2.3):
 * progress dots + quiet skip up top, one card canvas, Back/Continue,
 * progress bar with XP count-up and encouragement copy.
 *
 * Mobile (§8): CTA docked in the bottom thumb zone with safe-area padding,
 * hidden while the keyboard is open (visualViewport listener).
 * Keyboard: Enter = Continue, Esc = skip menu.
 */
export function OnboardingShell({
  stepIndex,
  totalSteps,
  xp,
  progressPct,
  showSkip,
  onBack,
  onContinue,
  onSkipStep,
  onFinishLater,
  continueLabel = "Continue",
  continueDisabled,
  children,
}: {
  stepIndex: number;
  totalSteps: number;
  xp: number;
  progressPct: number;
  showSkip: boolean;
  onBack?: () => void;
  onContinue: () => void;
  onSkipStep: () => void;
  onFinishLater: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  children: ReactNode;
}) {
  const profile = useCurrentProfile();
  const [skipOpen, setSkipOpen] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const continueRef = useRef(onContinue);
  continueRef.current = onContinue;
  const disabledRef = useRef(continueDisabled);
  disabledRef.current = continueDisabled;

  // Enter = Continue, Esc = skip menu (§8 desktop adaptation).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === "Enter" && tag !== "TEXTAREA" && tag !== "BUTTON") {
        if (!disabledRef.current) continueRef.current();
      } else if (e.key === "Escape") {
        setSkipOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Hide the docked CTA while the on-screen keyboard is open (§8).
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => setKeyboardOpen(vv.height < window.innerHeight * 0.75);
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  const encouragement = encouragementFor(progressPct);

  return (
    // h-[100dvh] + overflow-hidden: the shell is exactly one viewport tall so the
    // footer CTA is always on screen; only the card canvas scrolls (§8 mobile).
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-[var(--color-background)]">
      {/* Soft radial teal glow behind the active card (§1 visual language). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(6,148,148,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Top bar: dots · step counter · avatar + quiet skip */}
      <header className="relative flex items-center justify-between px-4 pt-4 sm:px-8 sm:pt-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {Array.from({ length: totalSteps }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "h-2 w-2 rounded-full transition-tenacious",
                  i <= stepIndex ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]",
                )}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
            Step {stepIndex + 1} of {totalSteps}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Their real face, everywhere, immediately (§4 C2 success state). */}
          {profile?.profile_photo_url ? (
            <img
              src={profile.profile_photo_url}
              alt=""
              className="h-8 w-8 rounded-full object-cover ring-2 ring-[var(--color-primary-light)]"
            />
          ) : profile ? (
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-primary-light)] text-xs font-semibold text-[var(--color-primary-hover)]">
              {initials(profile.display_name)}
            </span>
          ) : null}
          {showSkip && (
            <DropdownMenu open={skipOpen} onOpenChange={setSkipOpen}>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] transition-tenacious hover:bg-[var(--color-surface)]">
                  Skip for now
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onSkipStep}>Skip this step</DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onFinishLater}
                  className="text-[var(--color-text-secondary)]"
                >
                  Finish later
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* Step canvas — one card, one decision (§1 rule 1). min-h-0 + overflow lets
          the card scroll under the docked footer instead of growing the page. */}
      <main className="relative mx-auto flex w-full max-w-[560px] min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-40 pt-6 sm:px-0 sm:pb-32">
        {children}
      </main>

      {/* Docked footer: Back / Continue + progress bar + XP (§2.3). */}
      <footer
        className={cn(
          "fixed inset-x-0 bottom-0 z-20 border-t border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur transition-tenacious",
          keyboardOpen && "translate-y-full opacity-0",
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto w-full max-w-[560px] px-4 py-2.5 sm:px-0 sm:py-3">
          <div className="flex items-center justify-between gap-3">
            {onBack ? (
              <Button variant="ghost" onClick={onBack}>
                Back
              </Button>
            ) : (
              <span />
            )}
            <Button onClick={onContinue} disabled={continueDisabled} className="min-w-[132px]">
              {continueLabel}
            </Button>
          </div>
          <Progress
            value={progressPct}
            className="mt-2 h-1.5 bg-[var(--color-primary-light)] [&>div]:bg-[var(--color-primary)] sm:mt-3"
          />
          <div className="mt-1.5 flex items-center justify-center gap-1 text-xs font-medium text-[var(--color-text-secondary)]">
            <XpCounter value={xp} /> XP · {progressPct}%
          </div>
          {encouragement && (
            <p className="mt-0.5 hidden text-center text-xs text-[var(--color-text-secondary)] sm:block">
              {encouragement}
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}
