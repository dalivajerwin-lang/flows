import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/reduced-motion";
import { useTicker } from "@/stores/ticker-store";

export function AssistantAvatar({ priorityAlert }: { priorityAlert: boolean }) {
  const reduced = useReducedMotion();
  // Derive pulse from the app-wide 1s ticker so we don't spawn a local setInterval.
  const now = useTicker((s) => s.now);
  const pulse = !reduced && Math.floor(now / 1000) % 2 === 0;
  const ring = priorityAlert ? "rgba(220,38,38,0.6)" : "rgba(6,148,148,0.6)";
  return (
    <div className="relative h-9 w-9 shrink-0">
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 rounded-full transition-all duration-[2000ms]",
          pulse ? "scale-110 opacity-100" : "scale-100 opacity-60",
        )}
        style={{ boxShadow: `0 0 0 2px ${ring}` }}
      />
      <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary-hover)] text-white font-bold text-sm">
        AI
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-white bg-[#16A34A]" />
      </div>
    </div>
  );
}
