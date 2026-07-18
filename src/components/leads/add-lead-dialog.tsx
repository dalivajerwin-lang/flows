import { useState } from "react";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { AddLeadForm } from "./add-lead-form";
import { DuplicateBlockModal } from "./duplicate-block-modal";
import { DuplicateWarningModal } from "./duplicate-warning-modal";
import { createLead, type LeadCreateInput } from "@/stores/leads-store";
import { useCurrentProfile } from "@/stores/auth-store";
import type { LeadCreateFormValues } from "@/lib/lead-validation";

export function AddLeadDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const profile = useCurrentProfile();
  const isManager = profile?.role !== "property_consultant";
  const [blockOpen, setBlockOpen] = useState(false);
  const [warnPayload, setWarnPayload] = useState<LeadCreateInput | null>(null);

  async function trySubmit(values: LeadCreateFormValues, force = false) {
    const payload: LeadCreateInput = {
      full_name: values.full_name,
      contact_number: values.contact_number,
      source: values.source,
      source_other_description: values.source_other_description,
      project_id: values.project_id,
      unit_types: values.unit_types,
      date_added: values.date_added,
      assigned_to: values.assigned_to,
    };
    try {
      const res = await createLead(payload, { force });
      if ("block" in res) {
        setBlockOpen(true);
        return;
      }
      if ("warn" in res) {
        setWarnPayload(payload);
        return;
      }
      if (res.ok) {
        toast.success("Lead added");
        onOpenChange(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create lead");
    }
  }

  return (
    <>
      <ResponsiveDialog
        open={open}
        onOpenChange={onOpenChange}
        title={isManager ? "Add & Assign Client" : "Add a Client"}
      >
        <AddLeadForm
          isManager={isManager}
          onCancel={() => onOpenChange(false)}
          onSubmit={(v) => trySubmit(v, false)}
        />
      </ResponsiveDialog>
      <DuplicateBlockModal
        open={blockOpen}
        onOpenChange={setBlockOpen}
        onBackToLeads={() => {
          setBlockOpen(false);
          onOpenChange(false);
        }}
      />
      <DuplicateWarningModal
        open={warnPayload != null}
        onCancel={() => setWarnPayload(null)}
        onProceed={() => {
          if (!warnPayload) return;
          const payload = warnPayload;
          setWarnPayload(null);
          // Rebuild values object for force call
          trySubmit(
            {
              full_name: payload.full_name,
              contact_number: payload.contact_number,
              source: payload.source,
              source_other_description: payload.source_other_description ?? "",
              project_id: payload.project_id,
              unit_types: payload.unit_types,
              date_added: payload.date_added,
              assigned_to: payload.assigned_to,
            },
            true,
          );
        }}
      />
    </>
  );
}
