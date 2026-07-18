import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function TrashConfirmModal({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title="Move to Trash?" size="confirm">
      <p className="text-sm text-[var(--color-text-secondary)]">
        This lead will be moved to the Trash Bin. It can be recovered within 30 days before
        permanent database deletion.
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={onConfirm}>
          <Trash2 size={16} /> Move to Trash
        </Button>
      </div>
    </ResponsiveDialog>
  );
}
