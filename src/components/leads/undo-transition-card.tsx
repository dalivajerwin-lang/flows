import { useEffect } from "react";
import { Undo2 } from "lucide-react";
import { toast } from "sonner";
import { useTicker } from "@/stores/ticker-store";
import { useLead } from "@/stores/leads-store";
import { canUndoTransition, undoTransition, useActor } from "@/stores/pipeline-store";
import { pipelineNow } from "@/lib/pipeline-time";
import { Button } from "@/components/ui/tenacious-button";

/**
 * Floating card shown for 10 minutes after a consultant transitions a lead,
 * OR until the user navigates away from the lead page (which locks the undo).
 */
export function UndoTransitionCard({ leadId }: { leadId: string }) {
  const start = useTicker((s) => s.start);
  useEffect(() => start(), [start]);
  useTicker((s) => s.now); // subscribe for re-render

  const lead = useLead(leadId);
  const actor = useActor();

  if (!lead || !actor) return null;
  if (!canUndoTransition(lead as any, actor.id)) return null;
  const remainingMs = new Date(lead.undo_deadline!).getTime() - pipelineNow();
  if (remainingMs <= 0) return null;
  const mm = Math.floor(remainingMs / 60_000)
    .toString()
    .padStart(2, "0");
  const ss = Math.floor((remainingMs % 60_000) / 1000)
    .toString()
    .padStart(2, "0");

  return (
    <div className="sticky top-2 z-10 mb-4 flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-primary)] bg-[var(--color-primary-light)] px-4 py-3 shadow-[var(--shadow-sm)]">
      <div className="text-sm text-[var(--color-text)]">
        Stage changed.{" "}
        <span className="font-mono">
          ⏱️ {mm}:{ss}
        </span>{" "}
        remaining to Undo
      </div>
      <Button
        size="sm"
        variant="secondary"
        onClick={async () => {
          try {
            const r = await undoTransition(leadId, actor.id);
            if (r.ok) toast.success("Transition undone");
            else toast.error(r.error);
          } catch (err: any) {
            toast.error(err.message || "Failed to undo");
          }
        }}
      >
        <Undo2 size={14} /> Undo Transition
      </Button>
    </div>
  );
}
