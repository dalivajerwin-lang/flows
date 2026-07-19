import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BADGES } from "@/lib/onboarding-config";
import { useReducedMotion } from "@/lib/reduced-motion";
import { cn } from "@/lib/utils";

/** XP count-up — rAF tween, 300ms, tabular-nums (§6.2). */
export function XpCounter({ value, className }: { value: number; className?: string }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    if (reduced) {
      setShown(value);
      fromRef.current = value;
      return;
    }
    const from = fromRef.current;
    if (from === value) return;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 300);
      setShown(Math.round(from + (value - from) * t));
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduced]);

  return <span className={cn("tabular-nums", className)}>{shown}</span>;
}

/** Badge visual: 40px circle, primary-light fill, teal line icon, pill radius (§3.2). */
export function BadgeCircle({
  badgeId,
  size = 40,
  pop,
}: {
  badgeId: string;
  size?: number;
  pop?: boolean;
}) {
  const def = BADGES[badgeId];
  if (!def) return null;
  const Icon = def.icon;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-primary-light)] text-[var(--color-primary)]",
        pop && "onb-badge-pop",
      )}
      style={{ width: size, height: size }}
      title={def.name}
    >
      <Icon style={{ width: size * 0.45, height: size * 0.45 }} />
    </span>
  );
}

/** Badge-pop toast via sonner with custom JSX (§3.3). */
export function announceBadge(badgeId: string) {
  const def = BADGES[badgeId];
  if (!def) return;
  toast.success(
    <span className="flex items-center gap-3">
      <BadgeCircle badgeId={badgeId} pop />
      <span>
        <span className="block text-sm font-semibold">Badge earned — {def.name}</span>
        <span className="block text-xs text-[var(--color-text-secondary)]">{def.description}</span>
      </span>
    </span>,
  );
}

/** Self-drawing checkmark — SVG stroke-dashoffset, 250ms, teal (§3.3 / §6.2). */
export function CheckDraw({ className, size = 18 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M3.5 9.5l3.5 3.5 7.5-8"
        stroke="var(--color-primary)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="onb-check-draw"
      />
    </svg>
  );
}
