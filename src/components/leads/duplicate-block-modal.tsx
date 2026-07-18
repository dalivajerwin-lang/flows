import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";

export function DuplicateBlockModal({
  open,
  onOpenChange,
  onBackToLeads,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onBackToLeads: () => void;
}) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Duplicate Client Found"
      size="confirm"
    >
      <p className="text-sm text-[var(--color-text-secondary)]">
        This client is already registered in the system. Please request lead sharing or transfer
        from your Manager.
      </p>
      <div className="mt-6 flex justify-end">
        <Button onClick={onBackToLeads}>Back to Leads</Button>
      </div>
    </ResponsiveDialog>
  );
}
