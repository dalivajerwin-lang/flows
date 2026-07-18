import { useState } from "react";
import type { Period } from "@/lib/reports/time-filter";
import {
  weekPeriod,
  monthPeriod,
  allTimePeriod,
  currentMonthKey,
  shiftMonthKey,
} from "@/lib/reports/time-filter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PeriodPicker({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  const [monthKey, setMonthKey] = useState<string>(value.monthKey ?? currentMonthKey());
  const kind = value.kind;

  const pick = (k: "week" | "month" | "all") => {
    if (k === "week") onChange(weekPeriod());
    else if (k === "month") onChange(monthPeriod(monthKey));
    else onChange(allTimePeriod());
  };
  const shiftMonth = (delta: number) => {
    const key = shiftMonthKey(monthKey, delta);
    setMonthKey(key);
    onChange(monthPeriod(key));
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-white p-0.5 text-xs">
        {(["week", "month", "all"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => pick(k)}
            className={cn(
              "min-h-[32px] rounded-[var(--radius-pill)] px-3 font-medium transition-tenacious",
              kind === k
                ? "bg-[var(--color-primary)] text-white"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]",
            )}
          >
            {k === "week" ? "This Week" : k === "month" ? "Monthly" : "All Time"}
          </button>
        ))}
      </div>
      {kind === "month" && (
        <div className="inline-flex items-center gap-1">
          <Button size="sm" variant="outline" onClick={() => shiftMonth(-1)}>
            ‹
          </Button>
          <span className="min-w-[110px] text-center text-xs font-medium">{value.label}</span>
          <Button size="sm" variant="outline" onClick={() => shiftMonth(1)}>
            ›
          </Button>
        </div>
      )}
    </div>
  );
}
