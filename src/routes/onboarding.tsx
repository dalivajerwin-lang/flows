import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { requireAuth } from "@/lib/route-guards";
import { RouteErrorBoundary, RouteNotFoundBoundary } from "@/lib/route-boundaries";
import { useAuth, useCurrentProfile } from "@/stores/auth-store";
import { useOnboarding } from "@/stores/onboarding-store";
import { stepsFor, progressPercent } from "@/lib/onboarding-config";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { StepWelcome } from "@/components/onboarding/step-welcome";
import { StepProfile, saveProfileFields } from "@/components/onboarding/step-profile";
import { StepPipelineTour } from "@/components/onboarding/step-pipeline-tour";
import { StepFirstLead } from "@/components/onboarding/step-first-lead";
import {
  StepToolsCarousel,
  CONSULTANT_TOOLS,
  MANAGER_TOOLS,
} from "@/components/onboarding/step-tools-carousel";
import { StepWorkspace } from "@/components/onboarding/step-workspace";
import { StepInviteTeam } from "@/components/onboarding/step-invite-team";
import { StepPermissions } from "@/components/onboarding/step-permissions";
import { StepFinish } from "@/components/onboarding/step-finish";
import "@/components/onboarding/onboarding.css";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "Welcome — Tenacious CRM" }] }),
  component: OnboardingPage,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: RouteNotFoundBoundary,
});

/** Session flag the dashboard reads for the one-time blur-to-focus reveal (§9.5). */
const ONBOARDING_REVEAL_KEY = "tenacious.onboarding.reveal";

function OnboardingPage() {
  const navigate = useNavigate();
  const profile = useCurrentProfile();
  const hydrated = useAuth((s) => s.hydrated);
  const { state, stepIndex, start, back, advance, exitFlow, complete } = useOnboarding();

  // Direction for the step transition animation (§6.2).
  const [direction, setDirection] = useState<"fwd" | "back">("fwd");
  // Per-step gating flags — reset when the step index changes.
  const [stepReady, setStepReady] = useState(false);
  // Local field state for the profile step (saved on Continue).
  const [crfLink, setCrfLink] = useState("");
  const [inviteCount, setInviteCount] = useState(0);

  useEffect(() => {
    // The superadmin never onboards — bounce straight to the dashboard
    // (covers direct visits to /onboarding and stale redirects).
    if (hydrated && profile?.role === "superadmin") {
      navigate({ to: "/" });
      return;
    }
    if (hydrated && profile && !state) start();
  }, [hydrated, profile, state, start, navigate]);

  useEffect(() => setStepReady(false), [stepIndex]);

  if (!profile || profile.role === "superadmin" || !state) return null;

  const steps = stepsFor(state.role);
  const step = steps[stepIndex];
  const pct = progressPercent(state);

  const goDashboard = () => navigate({ to: "/" });

  const handleContinue = async () => {
    setDirection("fwd");
    if (step.id === "profile") {
      try {
        await saveProfileFields(crfLink);
      } catch (err: any) {
        toast.error(err.message || "Failed to save profile.");
        return;
      }
    }
    if (step.id === "finish") {
      complete();
      try {
        window.sessionStorage.setItem(ONBOARDING_REVEAL_KEY, "1");
      } catch {
        /* ignore */
      }
      goDashboard();
      return;
    }
    advance("done");
  };

  const handleSkipStep = () => {
    setDirection("fwd");
    advance("skipped");
  };

  const handleFinishLater = () => {
    exitFlow();
    toast("You can finish setup anytime from your dashboard.");
    goDashboard();
  };

  const handleBack = () => {
    setDirection("back");
    back();
  };

  // Continue gating per step: interactive steps unlock via their callbacks;
  // form steps are never blocked (optional fields, §7).
  const gated = step.id === "pipeline_tour" || step.id === "first_lead";
  const continueDisabled = gated && !stepReady;

  // Full-bleed bookends render without the card shell (§4 C1/C6).
  if (step.id === "welcome") {
    return <StepWelcome journeyRole={state.role} onContinue={handleContinue} />;
  }
  if (step.id === "finish") {
    return (
      <StepFinish
        journeyRole={state.role}
        state={state}
        inviteCount={inviteCount}
        onOpenDashboard={handleContinue}
      />
    );
  }

  return (
    <OnboardingShell
      stepIndex={stepIndex}
      totalSteps={steps.length}
      xp={state.xp}
      progressPct={pct}
      showSkip={!step.noSkip}
      onBack={stepIndex > 0 ? handleBack : undefined}
      onContinue={handleContinue}
      onSkipStep={handleSkipStep}
      onFinishLater={handleFinishLater}
      continueLabel={
        continueDisabled && step.id === "first_lead" ? "Add a client first" : "Continue"
      }
      continueDisabled={continueDisabled}
    >
      <div key={step.id} className={direction === "fwd" ? "onb-step-in" : "onb-step-in-back"}>
        {step.id === "profile" && (
          <StepProfile crfLink={crfLink} setCrfLink={setCrfLink} />
        )}
        {step.id === "pipeline_tour" && (
          <StepPipelineTour onReachedEnd={() => setStepReady(true)} />
        )}
        {step.id === "first_lead" && <StepFirstLead onLeadAdded={() => setStepReady(true)} />}
        {step.id === "daily_tools" && (
          <StepToolsCarousel
            title="Your daily toolkit"
            subtitle="Three surfaces you'll use every day beyond leads."
            cards={CONSULTANT_TOOLS}
            onViewedAll={() => setStepReady(true)}
          />
        )}
        {step.id === "workspace" && <StepWorkspace onGoalSaved={() => setStepReady(true)} />}
        {step.id === "invite_team" && <StepInviteTeam onInvitesChanged={setInviteCount} />}
        {step.id === "permissions" && <StepPermissions />}
        {step.id === "command_center" && (
          <StepToolsCarousel
            title="Your command center"
            subtitle="Three surfaces for running the team day to day."
            cards={MANAGER_TOOLS}
            onViewedAll={() => setStepReady(true)}
          />
        )}
      </div>
    </OnboardingShell>
  );
}
