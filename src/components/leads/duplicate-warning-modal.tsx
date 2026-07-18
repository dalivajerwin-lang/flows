import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";

export function DuplicateWarningModal({
  open,
  onCancel,
  onProceed,
}: {
  open: boolean;
  onCancel: () => void;
  onProceed: () => void;
}) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(v) => !v && onCancel()}
      title="Possible duplicate"
      size="confirm"
    >
      <p className="text-sm text-[var(--color-text-secondary)]">
        A lead with this name and project already exists. Please verify this is a different client
        before proceeding.
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onProceed}>Proceed Anyway</Button>
      </div>
    </ResponsiveDialog>
  );
}
