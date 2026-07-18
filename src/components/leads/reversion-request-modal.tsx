import { useState } from "react";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/tenacious-button";
import { Field } from "@/components/ui/form-controls";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STAGE_LABELS, type Stage } from "@/lib/constants";
import { requestStageReversion, useActor } from "@/stores/pipeline-store";
import { useLead } from "@/stores/leads-store";

const EARLIER_STAGES: Stage[] = ["new_lead", "crf", "reserved", "documentation"];

export function ReversionRequestModal({
  open,
  onOpenChange,
  leadId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leadId: string;
}) {
  const actor = useActor();
  const lead = useLead(leadId);
  const [target, setTarget] = useState<Stage | "">("");
  const [reason, setReason] = useState("");
  if (!lead || !actor) return null;

  const options = EARLIER_STAGES.filter((s) => {
    const order: Stage[] = ["new_lead", "crf", "reserved", "documentation", "closed_sale"];
    return order.indexOf(s) < order.indexOf(lead.stage as Stage);
  });

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title="Request Stage Reversion">
      <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
        Managers must approve. Include a clear reason.
      </p>
      <div className="space-y-3">
        <Field label="Target stage" htmlFor="rev-target" required>
          <Select value={target} onValueChange={(v) => setTarget(v as Stage)}>
            <SelectTrigger id="rev-target">
              <SelectValue placeholder="Select earlier stage" />
            </SelectTrigger>
            <SelectContent>
              {options.map((s) => (
                <SelectItem key={s} value={s}>
                  {STAGE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Reason (min 10 chars)" htmlFor="rev-reason" required>
          <Textarea
            id="rev-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          onClick={async () => {
            if (!target) return;
            try {
              const r = await requestStageReversion(leadId, target, reason, actor);
              if (!r.ok) {
                toast.error(r.error ?? "Failed");
                return;
              }
              toast.success("Reversion request submitted");
              onOpenChange(false);
            } catch (err: any) {
              toast.error(err.message || "Failed to submit request");
            }
          }}
        >
          Submit request
        </Button>
      </div>
    </ResponsiveDialog>
  );
}
