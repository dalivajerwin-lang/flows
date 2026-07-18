import * as React from "react";
import { cn } from "@/lib/utils";

export interface FieldProps {
  label: string;
  helper?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

export function Field({
  label,
  helper,
  error,
  required,
  htmlFor,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-[var(--color-text)]">
        {label}
        {required && <span className="ml-0.5 text-[var(--color-error)]">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-[var(--color-error)]">{error}</p>
      ) : helper ? (
        <p className="text-xs text-[var(--color-text-secondary)]">{helper}</p>
      ) : null}
    </div>
  );
}

const inputBase =
  "w-full min-h-[44px] rounded-[var(--radius-sm)] border bg-white px-3 text-base text-[var(--color-text)] " +
  "placeholder:text-[var(--color-text-placeholder)] transition-tenacious " +
  "focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] " +
  "disabled:opacity-50 disabled:bg-[var(--color-surface)]";

export const TenaciousInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }
>(({ className, hasError, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      inputBase,
      hasError ? "border-[var(--color-error)]" : "border-[var(--color-border)]",
      className,
    )}
    {...props}
  />
));
TenaciousInput.displayName = "TenaciousInput";

export const TenaciousTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { hasError?: boolean }
>(({ className, hasError, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      inputBase,
      "min-h-[96px] py-2",
      hasError ? "border-[var(--color-error)]" : "border-[var(--color-border)]",
      className,
    )}
    {...props}
  />
));
TenaciousTextarea.displayName = "TenaciousTextarea";

export const TenaciousSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { hasError?: boolean }
>(({ className, hasError, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      inputBase,
      hasError ? "border-[var(--color-error)]" : "border-[var(--color-border)]",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
TenaciousSelect.displayName = "TenaciousSelect";
