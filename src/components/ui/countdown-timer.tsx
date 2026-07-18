import { useCountdown } from "@/hooks/use-countdown";

export function CountdownTimer({ target }: { target: string | null | undefined }) {
  const label = useCountdown(target);
  if (!label) return null;
  return (
    <span className="inline-flex items-center rounded-[var(--radius-pill)] bg-[var(--color-surface)] px-2 py-0.5 font-mono text-xs text-[var(--color-text-secondary)] tabular-nums">
      {label}
    </span>
  );
}
