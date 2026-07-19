import { useState } from "react";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { AddLeadForm } from "./add-lead-form";
import { DuplicateBlockModal } from "./duplicate-block-modal";
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

  async function trySubmit(values: LeadCreateFormValues) {
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
      const res = await createLead(payload);
      if ("block" in res) {
        setBlockOpen(true);
        return;
      }
      if (res.ok) {
        // Same names happen all the time (namesakes, relatives) — the lead is
        // created either way; just leave a quiet heads-up.
        if (res.sameNameExistingId) {
          toast("Lead added — heads up: another lead with this name exists in this project.");
        } else {
          toast.success("Lead added");
        }
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
          onSubmit={(v) => trySubmit(v)}
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
    </>
  );
}
