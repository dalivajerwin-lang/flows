import type { ReactNode } from "react";
import { useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReportCard({
  title,
  icon,
  toolbar,
  children,
  expandable = true,
}: {
  title: string;
  icon?: string;
  toolbar?: ReactNode;
  children: ReactNode;
  expandable?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <section
      className={cn(
        "rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]",
        expanded && "col-span-full",
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] px-4 py-3">
        <h2 className="text-sm font-semibold">
          {icon && <span className="mr-1.5">{icon}</span>}
          {title}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {toolbar}
          {expandable && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="rounded-[var(--radius-sm)] p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          )}
        </div>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function EmptyStateBlock({ onChangePeriod }: { onChangePeriod?: () => void }) {
  return (
    <div className="py-8 text-center text-sm text-[var(--color-text-secondary)]">
      No activity recorded for the selected period. Try a different date range or check back after
      your team logs their first activity.
      {onChangePeriod && (
        <div className="mt-3">
          <button
            type="button"
            onClick={onChangePeriod}
            className="text-[var(--color-primary)] underline"
          >
            Change Period
          </button>
        </div>
      )}
    </div>
  );
}
