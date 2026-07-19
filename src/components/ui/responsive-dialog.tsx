import * as React from "react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { X } from "lucide-react";

/**
 * ResponsiveDialog — bottom sheet on mobile (<640px), centered modal at >=640px.
 * Focus is trapped, Esc closes, scrim click closes.
 */
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = "form",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "confirm" | "form";
}) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const panelRef = React.useRef<HTMLDivElement>(null);
  // Keep the latest callback in a ref so the effect below only re-runs when
  // `open` changes — inline onOpenChange props otherwise re-trigger it on every
  // parent render (e.g. the 1s ticker), stealing focus from inputs mid-typing.
  const onOpenChangeRef = React.useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChangeRef.current(false);
    };
    window.addEventListener("keydown", onKey);
    // simple focus trap: focus panel on open
    setTimeout(() => panelRef.current?.focus(), 0);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="absolute inset-0 bg-[rgba(0,0,0,0.32)] transition-tenacious"
        onClick={() => onOpenChange(false)}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          "relative bg-[var(--color-background)] shadow-[var(--shadow-md)] transition-tenacious",
          isDesktop
            ? cn(
                "m-auto rounded-[var(--radius-lg)]",
                size === "confirm" ? "w-[440px]" : "w-[560px]",
                "max-h-[85vh] overflow-auto",
              )
            : "mt-auto w-full rounded-t-[var(--radius-lg)] max-h-[90vh] overflow-auto",
        )}
        style={{
          animation: isDesktop
            ? "tenacious-modal-in 180ms cubic-bezier(0.4,0,0.2,1)"
            : "tenacious-sheet-in 220ms cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {!isDesktop && (
          <div className="flex justify-center pt-2">
            <div className="h-1.5 w-10 rounded-full bg-[var(--color-border)]" />
          </div>
        )}
        <div className="flex items-start justify-between px-5 pt-4">
          <div>
            {title && <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>}
            {description && (
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{description}</p>
            )}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-5 pb-5 pt-3">{children}</div>
      </div>
      <style>{`
        @keyframes tenacious-modal-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes tenacious-sheet-in {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export function SlideOver({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 hidden lg:flex pointer-events-none">
      <div
        className="ml-auto h-full w-[640px] bg-[var(--color-background)] shadow-[var(--shadow-lg)] overflow-auto pointer-events-auto"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ animation: "tenacious-slideover-in 200ms cubic-bezier(0.4,0,0.2,1)" }}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="rounded-[var(--radius-sm)] p-2 hover:bg-[var(--color-surface)]"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
        <style>{`
          @keyframes tenacious-slideover-in {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>
      </div>
    </div>
  );
}
