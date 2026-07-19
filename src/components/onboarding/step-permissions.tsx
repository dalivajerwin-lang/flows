import { Check, Minus } from "lucide-react";

/**
 * Who can do what — M5. Compact two-column comparison of real role rules drawn
 * from the actual RLS/UI behavior. Read-only explainer; roles are fixed per
 * account (§5 M5).
 */
const RULES: Array<{ rule: string; consultant: boolean | string; manager: boolean | string }> = [
  { rule: "See leads", consultant: "Own only", manager: "All leads" },
  { rule: "Assign leads to consultants", consultant: false, manager: true },
  { rule: "Internal notes on leads", consultant: false, manager: true },
  { rule: "Reports scope", consultant: "Own data", manager: "Whole team" },
  { rule: "Send broadcasts", consultant: false, manager: true },
];

export function StepPermissions() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-md)] sm:p-6">
      <h2 className="text-center text-[22px] font-bold text-[var(--color-text)] sm:text-2xl">
        Who can do what
      </h2>
      <p className="mt-1 text-center text-sm text-[var(--color-text-secondary)]">
        Thirty seconds of clarity before you invite anyone in.
      </p>

      <div className="mt-6 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]">
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 bg-[var(--color-surface)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
          <span />
          <span className="w-20 text-center">Consultants</span>
          <span className="w-20 text-center">Managers</span>
        </div>
        {RULES.map((r, i) => (
          <div
            key={r.rule}
            className="anim-rise grid grid-cols-[1fr_auto_auto] items-center gap-x-4 border-t border-[var(--color-border)] px-4 py-3 text-sm"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span className="font-medium text-[var(--color-text)]">{r.rule}</span>
            <RuleCell value={r.consultant} />
            <RuleCell value={r.manager} />
          </div>
        ))}
      </div>

      <p className="mt-3 text-center text-xs text-[var(--color-text-secondary)]">
        Roles are fixed per account and set when you invite someone.
      </p>
    </div>
  );
}

function RuleCell({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return (
      <span className="w-20 text-center text-xs font-medium text-[var(--color-text-secondary)]">
        {value}
      </span>
    );
  }
  return (
    <span className="flex w-20 justify-center">
      {value ? (
        <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-chip-success-bg)] text-[var(--color-chip-success-fg)]">
          <Check className="h-3.5 w-3.5" />
        </span>
      ) : (
        <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-chip-inactive-bg)] text-[var(--color-chip-inactive-fg)]">
          <Minus className="h-3.5 w-3.5" />
        </span>
      )}
    </span>
  );
}
