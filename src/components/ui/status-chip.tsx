import * as React from "react";
import { cn } from "@/lib/utils";
import type { Stage } from "@/lib/constants";
import { STAGE_LABELS } from "@/lib/constants";

export type ChipVariant =
  "success" | "warning" | "critical" | "info" | "inactive" | "brand" | "violet" | "archived";

const chipStyles: Record<ChipVariant, string> = {
  success: "bg-[var(--color-chip-success-bg)] text-[var(--color-chip-success-fg)]",
  warning: "bg-[var(--color-chip-warning-bg)] text-[var(--color-chip-warning-fg)]",
  critical: "bg-[var(--color-chip-critical-bg)] text-[var(--color-chip-critical-fg)]",
  info: "bg-[var(--color-chip-info-bg)] text-[var(--color-chip-info-fg)]",
  inactive: "bg-[var(--color-chip-inactive-bg)] text-[var(--color-chip-inactive-fg)]",
  brand: "bg-[var(--color-chip-brand-bg)] text-[var(--color-chip-brand-fg)]",
  violet: "bg-[var(--color-chip-violet-bg)] text-[var(--color-chip-violet-fg)]",
  archived: "bg-transparent text-[var(--color-text-secondary)] border border-[var(--color-border)]",
};

export function StatusChip({
  variant,
  children,
  className,
}: {
  variant: ChipVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-medium",
        chipStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

const stageToChip: Record<Stage, ChipVariant> = {
  new_lead: "info",
  crf: "brand",
  reserved: "violet",
  documentation: "warning",
  closed_sale: "success",
  cancelled: "inactive",
  archived: "archived",
};

export function StageBadge({ stage }: { stage: Stage }) {
  return <StatusChip variant={stageToChip[stage]}>{STAGE_LABELS[stage]}</StatusChip>;
}
