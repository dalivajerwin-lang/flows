/**
 * Onboarding journey configuration — steps, XP, badges (design doc §3–§5).
 * The durable per-user state lives in `profiles.onboarding` (jsonb, migration 014);
 * this file is the static shape both journeys are built from.
 */
import type { LucideIcon } from "lucide-react";
import { Camera, UserPlus, KanbanSquare, UsersRound, Target, Award } from "lucide-react";
import type { Role } from "@/lib/constants";

export type OnboardingRole = "manager" | "property_consultant";
export type StepStatus = "done" | "skipped" | null;

export interface OnboardingStepDef {
  id: string;
  /** Short chip label shown on the welcome screen preview. */
  label: string;
  xp: number;
  /** Welcome/finish render full-bleed dark without the card shell. */
  fullBleed?: boolean;
  /** Steps that are one-tap (welcome) hide the quiet skip affordance. */
  noSkip?: boolean;
}

/** Consultant journey — 6 steps, 100 XP total (§4). */
export const CONSULTANT_STEPS: OnboardingStepDef[] = [
  { id: "welcome", label: "Welcome", xp: 10, fullBleed: true, noSkip: true },
  { id: "profile", label: "Your profile", xp: 25 },
  { id: "pipeline_tour", label: "The pipeline", xp: 15 },
  { id: "first_lead", label: "First client", xp: 30 },
  { id: "daily_tools", label: "Daily toolkit", xp: 10 },
  { id: "finish", label: "You're ready", xp: 10, fullBleed: true, noSkip: true },
];

/** Manager journey — 7 steps (§5). XP is capped at 100 on accumulation. */
export const MANAGER_STEPS: OnboardingStepDef[] = [
  { id: "welcome", label: "Welcome", xp: 10, fullBleed: true, noSkip: true },
  { id: "workspace", label: "Workspace", xp: 20 },
  { id: "profile", label: "Your profile", xp: 25 },
  { id: "invite_team", label: "Invite team", xp: 25 },
  { id: "permissions", label: "Who can do what", xp: 10 },
  { id: "command_center", label: "Command center", xp: 10 },
  { id: "finish", label: "Workspace live", xp: 10, fullBleed: true, noSkip: true },
];

export function journeyRoleFor(role: Role): OnboardingRole {
  return role === "property_consultant" ? "property_consultant" : "manager";
}

export function stepsFor(journeyRole: OnboardingRole): OnboardingStepDef[] {
  return journeyRole === "property_consultant" ? CONSULTANT_STEPS : MANAGER_STEPS;
}

// ─── Badges (§3.2) ───────────────────────────────────────────────────────────

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
}

export const BADGES: Record<string, BadgeDef> = {
  face_forward: {
    id: "face_forward",
    name: "Face Forward",
    description: "Uploaded a profile photo",
    icon: Camera,
  },
  first_blood: {
    id: "first_blood",
    name: "First Client",
    description: "Added the first real lead",
    icon: UserPlus,
  },
  pipeline_pro: {
    id: "pipeline_pro",
    name: "Pipeline Pro",
    description: "Completed the pipeline tour",
    icon: KanbanSquare,
  },
  squad_assembled: {
    id: "squad_assembled",
    name: "Squad Assembled",
    description: "Sent the first team invite",
    icon: UsersRound,
  },
  goal_setter: {
    id: "goal_setter",
    name: "Goal Setter",
    description: "Set the team monthly goal",
    icon: Target,
  },
  day_one: {
    id: "day_one",
    name: "Day One",
    description: "Finished onboarding",
    icon: Award,
  },
};

// ─── Persisted state shape (profiles.onboarding jsonb, §2.2) ─────────────────

export interface OnboardingState {
  version: 1;
  role: OnboardingRole;
  steps: Record<string, StepStatus>;
  xp: number;
  badges: string[];
  startedAt: string;
  completedAt: string | null;
  skippedAt: string | null;
  /** First-day activation checklist (§10.1) — per-item done flags. */
  firstDay?: Record<string, boolean>;
  firstDayDismissed?: boolean;
  /** Dismissal of the dashboard resume banner (§7). */
  resumeBannerDismissed?: boolean;
}

export function emptyOnboardingState(role: OnboardingRole): OnboardingState {
  const steps: Record<string, StepStatus> = {};
  for (const s of stepsFor(role)) steps[s.id] = null;
  return {
    version: 1,
    role,
    steps,
    xp: 0,
    badges: [],
    startedAt: new Date().toISOString(),
    completedAt: null,
    skippedAt: null,
  };
}

/** Null-safe parse of the jsonb column. */
export function parseOnboarding(raw: unknown): OnboardingState | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as OnboardingState;
  if (o.version !== 1 || !o.role || !o.steps) return null;
  return o;
}

/** True when the flow should auto-trigger on login: never started at all.
 * A started-but-abandoned flow must NOT re-hijack every login — the dashboard
 * resume banner (isOnboardingIncomplete) is the way back in. */
export function needsOnboarding(raw: unknown): boolean {
  return parseOnboarding(raw) == null;
}

/** True when the dashboard resume banner should show: started but unfinished. */
export function isOnboardingIncomplete(raw: unknown): boolean {
  const o = parseOnboarding(raw);
  if (!o) return false;
  return o.completedAt == null && !o.resumeBannerDismissed;
}

/** Index of the first step that is neither done nor skipped (resume point, §7). */
export function firstIncompleteIndex(state: OnboardingState): number {
  const steps = stepsFor(state.role);
  const i = steps.findIndex((s) => state.steps[s.id] == null);
  return i === -1 ? steps.length - 1 : i;
}

export function remainingSteps(state: OnboardingState): number {
  return stepsFor(state.role).filter((s) => state.steps[s.id] == null).length;
}

/** Progress percent driven by advanced (done or skipped) steps — skips still advance (§3.1). */
export function progressPercent(state: OnboardingState): number {
  const steps = stepsFor(state.role);
  const advanced = steps.filter((s) => state.steps[s.id] != null).length;
  return Math.round((advanced / steps.length) * 100);
}

/** Rotating encouragement copy under the progress bar (§3.4). */
export function encouragementFor(pct: number): string | null {
  if (pct >= 86 && pct <= 99) return "One more step. Make it count.";
  if (pct >= 61) return "Almost done. Your CRM is taking shape.";
  if (pct >= 40) return "Halfway there — this is the fun part.";
  return null;
}

// ─── First-day checklist items (§10.1) ───────────────────────────────────────

export interface FirstDayItem {
  id: string;
  label: string;
  /** In-app destination for the item's action. */
  to: string;
  /** Optional search params for the destination (e.g. assistant panel deep-link). */
  search?: Record<string, string>;
}

export const CONSULTANT_FIRST_DAY: FirstDayItem[] = [
  { id: "add_crf_link", label: "Add your CRF link", to: "/profile" },
  { id: "view_schedule", label: "View your schedule", to: "/schedule" },
  {
    id: "add_daily_agenda",
    label: "Add a daily agenda",
    to: "/assistant",
    search: { panel: "agenda" },
  },
];

export const MANAGER_FIRST_DAY: FirstDayItem[] = [
  { id: "send_invites", label: "Send your invite links", to: "/team" },
  { id: "add_crf_link", label: "Add your CRF link", to: "/profile" },
  { id: "add_project", label: "Add your first project in Projects", to: "/projects-admin" },
  { id: "post_broadcast", label: "Post a welcome broadcast to the team", to: "/" },
];

export function firstDayItemsFor(journeyRole: OnboardingRole): FirstDayItem[] {
  return journeyRole === "property_consultant" ? CONSULTANT_FIRST_DAY : MANAGER_FIRST_DAY;
}
