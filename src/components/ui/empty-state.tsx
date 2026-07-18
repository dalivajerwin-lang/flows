import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./tenacious-button";
import { AlertTriangle, Inbox, RotateCw } from "lucide-react";

export function EmptyState({
  icon,
  headline,
  description,
  actionLabel,
  onAction,
  className,
}: {
  icon?: React.ReactNode;
  headline: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-text-secondary)]">
        {icon ?? <Inbox size={22} />}
      </div>
      <h3 className="text-base font-semibold text-[var(--color-text)]">{headline}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-[var(--color-text-secondary)]">{description}</p>
      )}
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-chip-critical-bg)] text-[var(--color-chip-critical-fg)]">
        <AlertTriangle size={22} />
      </div>
      <h3 className="text-base font-semibold text-[var(--color-text)]">Something went wrong</h3>
      <p className="mt-1 max-w-sm text-sm text-[var(--color-text-secondary)]">{message}</p>
      {onRetry && (
        <div className="mt-5">
          <Button variant="secondary" onClick={onRetry}>
            <RotateCw size={16} /> Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
