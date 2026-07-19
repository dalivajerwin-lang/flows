import { useEffect, useRef, useState } from "react";
import { Target, FolderOpen } from "lucide-react";
import { useProjects } from "@/hooks/use-projects";
import { useDashboardData, useUpsertTeamGoal } from "@/hooks/use-dashboard-data";
import { selectTeamGoal } from "@/lib/dashboard-selectors";
import { compactPeso } from "@/lib/format-currency";
import { useOnboarding } from "@/stores/onboarding-store";
import { useReducedMotion } from "@/lib/reduced-motion";
import { announceBadge } from "./onboarding-bits";
import { cn } from "@/lib/utils";

/**
 * Set up your workspace — M2. Card 1: team monthly goal (₱, en-PH formatting,
 * PH-market suggestion chips) writing to the same team_goals storage the
 * dashboard uses. Card 2: read-only projects sanity check via useProjects().
 */
const GOAL_SUGGESTIONS = [5_000_000, 10_000_000, 20_000_000];

export function StepWorkspace({ onGoalSaved }: { onGoalSaved: () => void }) {
  const { db } = useDashboardData();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const upsertTeamGoal = useUpsertTeamGoal();
  const awardBadge = useOnboarding((s) => s.awardBadge);
  const reduced = useReducedMotion();
  const existingGoal = selectTeamGoal(db);

  const [amount, setAmount] = useState<number>(existingGoal ?? 0);
  const [displayAmount, setDisplayAmount] = useState<number>(existingGoal ?? 0);
  const savedRef = useRef(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (existingGoal && amount === 0) {
      setAmount(existingGoal);
      setDisplayAmount(existingGoal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingGoal]);

  /** Suggestion-chip fill: input counts up to target over 250ms (§6.2). */
  function pickSuggestion(target: number) {
    cancelAnimationFrame(rafRef.current);
    setAmount(target);
    if (reduced) {
      setDisplayAmount(target);
      return;
    }
    const from = displayAmount;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 250);
      setDisplayAmount(Math.round(from + (target - from) * t));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  function saveGoal() {
    if (amount <= 0) return;
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    upsertTeamGoal.mutate({ month: monthKey, amount });
    if (!savedRef.current) {
      savedRef.current = true;
      if (awardBadge("goal_setter")) announceBadge("goal_setter");
      onGoalSaved();
    }
  }

  const formatted = new Intl.NumberFormat("en-PH").format(displayAmount);

  return (
    <div className="space-y-4">
      {/* Card 1 — Team goal */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-md)] sm:p-6">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-[var(--color-primary)]" />
          <h2 className="text-lg font-bold text-[var(--color-text)]">
            Set your team's monthly goal
          </h2>
        </div>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          This powers the goal tracker on everyone's dashboard from day one.
        </p>

        <div className="relative mt-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base font-semibold text-[var(--color-text-secondary)]">
            ₱
          </span>
          <input
            inputMode="numeric"
            value={displayAmount > 0 ? formatted : ""}
            onChange={(e) => {
              const n = Number(e.target.value.replace(/[^\d]/g, ""));
              cancelAnimationFrame(rafRef.current);
              setAmount(n);
              setDisplayAmount(n);
            }}
            onBlur={saveGoal}
            placeholder="10,000,000"
            className="w-full min-h-[44px] rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white pl-8 pr-3 text-base tabular-nums text-[var(--color-text)] placeholder:text-[var(--color-text-placeholder)] transition-tenacious focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {GOAL_SUGGESTIONS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => pickSuggestion(v)}
              className={cn(
                "rounded-[var(--radius-pill)] border px-3.5 py-1.5 text-sm font-semibold transition-tenacious active:scale-[0.97]",
                amount === v
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary-hover)]"
                  : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]",
              )}
            >
              {compactPeso(v)}
            </button>
          ))}
        </div>
        {amount > 0 && (
          <button
            type="button"
            onClick={saveGoal}
            className="mt-3 text-sm font-semibold text-[var(--color-primary)] hover:underline"
          >
            {savedRef.current ? "Goal saved ✓ — update anytime" : "Save goal"}
          </button>
        )}
      </div>

      {/* Card 2 — Projects sanity check (informational, §5 M2). */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-md)] sm:p-6">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-[var(--color-primary)]" />
          <h2 className="text-lg font-bold text-[var(--color-text)]">Your projects</h2>
        </div>
        {projectsLoading ? (
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Loading projects…</p>
        ) : projects.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            No projects yet — add your first on the <strong>Projects</strong> page after
            onboarding. We'll remind you on your first-day checklist.
          </p>
        ) : (
          <>
            <ul className="mt-3 space-y-1.5">
              {projects.slice(0, 5).map((p, i) => (
                <li
                  key={p.id}
                  className="anim-rise flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
                  <span className="truncate font-medium">{p.name}</span>
                  {p.developer && (
                    <span className="truncate text-xs text-[var(--color-text-secondary)]">
                      · {p.developer}
                    </span>
                  )}
                </li>
              ))}
              {projects.length > 5 && (
                <li className="px-3 text-xs text-[var(--color-text-secondary)]">
                  +{projects.length - 5} more
                </li>
              )}
            </ul>
            <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
              Projects are managed on the Projects page — you can refine these anytime.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
