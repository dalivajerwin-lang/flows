import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";

export function RestoreConflictModal({
  open,
  onOpenChange,
  activeAgentName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  activeAgentName: string;
}) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title="Cannot restore" size="confirm">
      <p className="text-sm text-[var(--color-text-secondary)]">
        Cannot restore. Client is already registered under {activeAgentName}. Would you like to
        merge or view details?
      </p>
      <div className="mt-6 flex justify-end">
        <Button onClick={() => onOpenChange(false)}>Close</Button>
      </div>
    </ResponsiveDialog>
  );
}
