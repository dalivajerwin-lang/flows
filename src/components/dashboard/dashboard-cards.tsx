/**
 * Dashboard presentational building blocks — no hooks, no selectors, no state.
 * All colors/radii/shadows come from the design tokens in src/styles/tokens.css.
 */
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

// ==== Section header ====

export function SectionHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-2", className)}>
      <h2 className="text-base font-semibold text-(--color-text)">{title}</h2>
      {action}
    </div>
  );
}

// ==== Hero card ====

export function HeroCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-(--radius-lg) border border-(--color-border) bg-white p-5 shadow-(--shadow-sm)",
        className,
      )}
    >
      {children}
    </div>
  );
}

export type HeroTone = "brand" | "critical" | "warning";

const HERO_TONE: Record<HeroTone, { circle: string; value: string }> = {
  brand: {
    circle: "bg-(--color-primary-light) text-(--color-primary-hover)",
    value: "text-(--color-text)",
  },
  critical: {
    circle: "bg-(--color-chip-critical-bg) text-(--color-chip-critical-fg)",
    value: "text-(--color-chip-critical-fg)",
  },
  warning: {
    circle: "bg-(--color-chip-warning-bg) text-(--color-chip-warning-fg)",
    value: "text-(--color-text)",
  },
};

export function HeroStat({
  icon,
  value,
  label,
  tone = "brand",
  onClick,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  tone?: HeroTone;
  onClick?: () => void;
}) {
  const t = HERO_TONE[tone];
  // Stack icon above text on phones so the label gets the full column width to
  // wrap onto two lines; icon sits beside text from sm: up.
  const inner = (
    <>
      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", t.circle)}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className={cn("block text-2xl font-semibold leading-tight tabular-nums", t.value)}>
          {value}
        </span>
        <span className="block text-xs font-medium leading-tight text-(--color-text-secondary)">
          {label}
        </span>
      </span>
    </>
  );
  const layout = "flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3";
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(
          layout,
          "rounded-(--radius-sm) p-1 -m-1 text-left transition-tenacious hover:bg-(--color-surface)",
        )}
      >
        {inner}
      </button>
    );
  }
  return <div className={layout}>{inner}</div>;
}

// ==== Compact stat card with context + trend ====

export type Trend = { dir: "up" | "down" | "flat"; text: string } | null;

export function StatCard({
  value,
  label,
  context,
  trend,
  onClick,
}: {
  value: React.ReactNode;
  label: string;
  context?: string;
  trend?: Trend;
  onClick?: () => void;
}) {
  const body = (
    <>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xl font-semibold leading-tight text-(--color-text) tabular-nums">
          {value}
        </span>
        {trend && <TrendChip trend={trend} />}
      </div>
      <div className="mt-1 text-xs font-medium text-(--color-text-secondary)">{label}</div>
      {context && (
        <div className="mt-0.5 truncate text-[11px] text-(--color-text-placeholder)">{context}</div>
      )}
    </>
  );
  const base =
    "rounded-(--radius-md) border border-(--color-border) bg-white p-3.5 shadow-(--shadow-sm)";
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(base, "text-left transition-tenacious hover:border-(--color-primary)")}
      >
        {body}
      </button>
    );
  }
  return <div className={base}>{body}</div>;
}

function TrendChip({ trend }: { trend: NonNullable<Trend> }) {
  const Icon = trend.dir === "up" ? TrendingUp : trend.dir === "down" ? TrendingDown : Minus;
  const color =
    trend.dir === "up"
      ? "text-(--color-success)"
      : trend.dir === "down"
        ? "text-(--color-error)"
        : "text-(--color-text-secondary)";
  return (
    <span
      className={cn("inline-flex shrink-0 items-center gap-0.5 text-[11px] font-medium", color)}
    >
      <Icon className="h-3 w-3" />
      {trend.text}
    </span>
  );
}

// ==== Quick-link shortcut (small icon widget for the horizontal strip) ====

export function ShortcutButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center transition-tenacious active:scale-[0.94]"
      aria-label={label}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-(--radius-md) border border-(--color-border) bg-white text-(--color-primary-hover) shadow-(--shadow-sm) transition-tenacious hover:bg-(--color-primary-light)">
        {icon}
      </span>
      <span className="w-full truncate text-[11px] font-medium leading-tight text-(--color-text-secondary)">
        {label}
      </span>
    </button>
  );
}

// ==== Pipeline stage row ====

export function PipelineBar({
  label,
  dotColor,
  count,
  pct,
  onClick,
}: {
  label: string;
  dotColor: string;
  count: number;
  pct: number; // 0..100
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-(--radius-sm) p-1.5 -mx-1.5 text-left transition-tenacious hover:bg-(--color-surface)"
    >
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="flex items-center gap-2 text-(--color-text)">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: dotColor }}
            aria-hidden
          />
          {label}
        </span>
        <span className="tabular-nums text-(--color-text-secondary)">{count}</span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-(--color-surface)">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: dotColor }}
        />
      </div>
    </button>
  );
}

// ==== Timeline item (rail + dot) ====

export function TimelineItem({
  children,
  isLast = false,
}: {
  children: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <li className="relative flex gap-3">
      <div className="flex flex-col items-center">
        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-(--color-primary)" aria-hidden />
        {!isLast && <span className="w-px flex-1 bg-(--color-border)" aria-hidden />}
      </div>
      <div className={cn("min-w-0 flex-1", !isLast && "pb-3")}>{children}</div>
    </li>
  );
}
