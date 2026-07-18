import * as React from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/tenacious-button";
import { Field, TenaciousInput } from "@/components/ui/form-controls";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STAGE_LABELS, type Stage } from "@/lib/constants";
import { dateKeyManila, todayKeyManila } from "@/lib/schedule-time";
import {
  REQUIRED_FIELDS,
  transitionLead,
  useActor,
  type TransitionFields,
} from "@/stores/pipeline-store";
import { useLead } from "@/stores/leads-store";
import { toast } from "sonner";

export function StageTransitionModal({
  open,
  onOpenChange,
  leadId,
  toStage,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leadId: string;
  toStage: Stage | null;
  onSuccess?: () => void;
}) {
  const actor = useActor();
  const lead = useLead(leadId);
  const [fields, setFields] = React.useState<TransitionFields>({});
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setFields({});
      setError(null);
    }
  }, [open, toStage]);

  if (!open || !toStage || !lead || !actor) return null;

  const required = REQUIRED_FIELDS[toStage];
  const todayIso = todayKeyManila();

  const submit = async () => {
    setError(null);

    // Client-side validation: check required fields before hitting the RPC.
    const required = REQUIRED_FIELDS[toStage];
    for (const key of required) {
      const v = (fields as any)[key];
      if (v == null || v === "" || (typeof v === "number" && !(v > 0))) {
        setError(`${key.replaceAll("_", " ")} is required.`);
        return;
      }
    }
    if (toStage === "cancelled" && (fields.cancellation_reason?.trim().length ?? 0) < 5) {
      setError("Cancellation reason must be at least 5 characters.");
      return;
    }

    try {
      const res = await transitionLead(leadId, toStage, fields, actor);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success(`Moved to ${STAGE_LABELS[toStage]}`);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Transition failed");
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title="Confirm stage transition">
      <p className="mb-4 text-sm text-[var(--color-text)]">
        You are moving <strong>{lead.full_name}</strong> from{" "}
        <strong>{STAGE_LABELS[lead.stage as Stage]}</strong> to{" "}
        <strong>{STAGE_LABELS[toStage]}</strong>. Confirm transition?
      </p>

      <div className="space-y-3">
        {required.includes("crf_submission_date") && (
          <Field label="CRF Submission Date" htmlFor="crf-date" required>
            <TenaciousInput
              id="crf-date"
              type="date"
              max={todayIso}
              value={fields.crf_submission_date ? dateKeyManila(fields.crf_submission_date) : ""}
              onChange={(e) =>
                setFields((f) => ({
                  ...f,
                  crf_submission_date: e.target.value
                    ? new Date(e.target.value + "T00:00:00+08:00").toISOString()
                    : undefined,
                }))
              }
            />
          </Field>
        )}
        {required.includes("unit_description") && (
          <Field label="Unit Description" htmlFor="unit-desc" required>
            <TenaciousInput
              id="unit-desc"
              placeholder="e.g. Tower A, Unit 12-05, 1BR"
              value={fields.unit_description ?? ""}
              onChange={(e) => setFields((f) => ({ ...f, unit_description: e.target.value }))}
            />
          </Field>
        )}
        {required.includes("unit_payment_date") && (
          <Field label="Unit Payment Date" htmlFor="unit-pay" required>
            <TenaciousInput
              id="unit-pay"
              type="date"
              value={fields.unit_payment_date ? dateKeyManila(fields.unit_payment_date) : ""}
              onChange={(e) =>
                setFields((f) => ({
                  ...f,
                  unit_payment_date: e.target.value
                    ? new Date(e.target.value + "T00:00:00+08:00").toISOString()
                    : undefined,
                }))
              }
            />
          </Field>
        )}
        {required.includes("unit_payment_status") && (
          <Field label="Payment Status" htmlFor="unit-status" required>
            <Select
              value={fields.unit_payment_status ?? ""}
              onValueChange={(v) =>
                setFields((f) => ({ ...f, unit_payment_status: v as "paid" | "unpaid" }))
              }
            >
              <SelectTrigger id="unit-status">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        )}
        {required.includes("documentation_start_date") && (
          <Field label="Documentation Start Date" htmlFor="doc-date" required>
            <TenaciousInput
              id="doc-date"
              type="date"
              value={
                fields.documentation_start_date
                  ? dateKeyManila(fields.documentation_start_date)
                  : ""
              }
              onChange={(e) =>
                setFields((f) => ({
                  ...f,
                  documentation_start_date: e.target.value
                    ? new Date(e.target.value + "T00:00:00+08:00").toISOString()
                    : undefined,
                }))
              }
            />
          </Field>
        )}
        {required.includes("sale_price") && (
          <Field label="Sale Price (PHP)" htmlFor="sale-price" required>
            <TenaciousInput
              id="sale-price"
              type="number"
              min={1}
              value={fields.sale_price ?? ""}
              onChange={(e) =>
                setFields((f) => ({
                  ...f,
                  sale_price: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
            />
          </Field>
        )}
        {required.includes("sale_payment_date") && (
          <Field label="Payment Date" htmlFor="pay-date" required>
            <TenaciousInput
              id="pay-date"
              type="date"
              value={fields.sale_payment_date ? dateKeyManila(fields.sale_payment_date) : ""}
              onChange={(e) =>
                setFields((f) => ({
                  ...f,
                  sale_payment_date: e.target.value
                    ? new Date(e.target.value + "T00:00:00+08:00").toISOString()
                    : undefined,
                }))
              }
            />
          </Field>
        )}
        {required.includes("cancellation_reason") && (
          <Field label="Cancellation Reason" htmlFor="cancel-reason" required>
            <Textarea
              id="cancel-reason"
              rows={3}
              placeholder="At least 5 characters"
              value={fields.cancellation_reason ?? ""}
              onChange={(e) => setFields((f) => ({ ...f, cancellation_reason: e.target.value }))}
            />
          </Field>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded-[var(--radius-sm)] border border-[var(--color-error)] bg-[var(--color-error-bg)] px-3 py-2 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={submit}>Confirm transition</Button>
      </div>
    </ResponsiveDialog>
  );
}
