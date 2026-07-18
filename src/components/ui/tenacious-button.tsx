import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "success" | "destructive" | "warning-outline";

type Size = "default" | "sm";

const variantStyles: Record<Variant, string> = {
  primary: "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]",
  secondary:
    "bg-white text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-surface)]",
  ghost: "bg-transparent text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]",
  success: "bg-[var(--color-success)] text-white hover:brightness-95",
  destructive: "bg-[var(--color-error)] text-white hover:brightness-95",
  "warning-outline":
    "bg-transparent border border-[var(--color-warning)] text-[var(--color-warning)] hover:bg-[color-mix(in_oklab,var(--color-warning)_10%,transparent)]",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "default", fullWidth, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] font-semibold text-base",
          "transition-tenacious active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none",
          size === "default" ? "min-h-[44px] px-4" : "min-h-[36px] px-3 text-sm",
          fullWidth && "w-full",
          variantStyles[variant],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
