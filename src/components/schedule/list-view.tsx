import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/tenacious-button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { StatusChip } from "@/components/ui/status-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { useCurrentProfile } from "@/stores/auth-store";
import { useProfiles } from "@/hooks/use-profiles";
import { type Appointment } from "@/stores/schedule-store";
import {
  deleteAppointment,
  dismissCancellationFlag,
  flagCancellation,
  groupByDateKey,
} from "@/stores/schedule-store";
import {
  APPOINTMENT_TYPE_LABELS,
  APPOINTMENT_TYPE_COLORS,
  isClientAppointment,
} from "@/lib/schedule-types";
import { dateGroupLabel, formatManilaTimeRange } from "@/lib/schedule-time";
import { ColorDot } from "./event-chip";
import { EventDetailDialog } from "./event-detail-dialog";
import { AppointmentFormDialog } from "./appointment-form-dialog";

const PAGE_SIZE = 20;

export function ListView({
  appointments,
  subsystem,
  isManager,
  onCreate,
}: {
  appointments: Appointment[];
  subsystem: "client" | "manning";
  isManager: boolean;
  onCreate?: () => void;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<Appointment | null>(null);

  // Sort ASC, keep only upcoming + today
  const sorted = useMemo(
    () =>
      [...appointments].sort(
        (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
      ),
    [appointments],
  );
  const paged = sorted.slice(0, visibleCount);
  const groups = useMemo(() => groupByDateKey(paged), [paged]);

  if (sorted.length === 0) {
    const desc =
      subsystem === "client"
        ? "No appointments scheduled. Client meetings and tripping schedules will appear here."
        : "No manning or booth duty shifts scheduled yet.";
    return (
      <EmptyState
        headline="No appointments scheduled"
        description={desc}
        actionLabel={isManager ? "New Appointment" : undefined}
        onAction={isManager ? onCreate : undefined}
      />
    );
  }

  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([key, items]) => (
        <section key={key}>
          <h3 className="mb-2 text-sm font-semibold text-[var(--color-text-secondary)]">
            {dateGroupLabel(key)}
          </h3>
          <div className="space-y-2">
            {items.map((a) => (
              <ListRow
                key={a.id}
                appointment={a}
                onOpen={() => setSelected(a)}
                onEdit={() => setEditing(a)}
                onDelete={() => setConfirmingDelete(a)}
              />
            ))}
          </div>
        </section>
      ))}
      {visibleCount < sorted.length && (
        <div className="pt-2 text-center">
          <Button variant="secondary" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
            Load more
          </Button>
        </div>
      )}

      <EventDetailDialog
        appointment={selected}
        onClose={() => setSelected(null)}
        onEdit={() => {
          setEditing(selected);
          setSelected(null);
        }}
        onDelete={() => {
          setConfirmingDelete(selected);
          setSelected(null);
        }}
      />
      <AppointmentFormDialog
        open={!!editing}
        editing={editing}
        onOpenChange={(v) => !v && setEditing(null)}
      />
      <ConfirmDeleteDialog
        appointment={confirmingDelete}
        onClose={() => setConfirmingDelete(null)}
      />
    </div>
  );
}

function ListRow({
  appointment,
  onOpen,
  onEdit,
  onDelete,
}: {
  appointment: Appointment;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const profile = useCurrentProfile();
  const { data: profiles = [] } = useProfiles();
  if (!profile) return null;
  const isManager = profile.role !== "property_consultant";
  const isOwnClient =
    !isManager &&
    isClientAppointment(appointment.appointment_type) &&
    appointment.consultant_id === profile.id;
  const consultant = profiles.find((p) => p.id === appointment.consultant_id);
  const color =
    APPOINTMENT_TYPE_COLORS[appointment.appointment_type as keyof typeof APPOINTMENT_TYPE_COLORS];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] p-3 shadow-[var(--shadow-sm)] transition-tenacious hover:shadow-[var(--shadow-md)]">
      <button
        type="button"
        onClick={onOpen}
        className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-3 text-left"
      >
        <span
          className="mt-1.5 h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-semibold text-[var(--color-text)]">
              {appointment.title}
            </span>
            {appointment.cancellation_requested_by && (
              <StatusChip variant="warning">
                <AlertTriangle size={12} className="mr-1" /> Cancellation requested
              </StatusChip>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--color-text-secondary)]">
            <span className="inline-flex items-center gap-1">
              <ColorDot type={appointment.appointment_type} />
              {
                APPOINTMENT_TYPE_LABELS[
                  appointment.appointment_type as keyof typeof APPOINTMENT_TYPE_LABELS
                ]
              }
            </span>
            <span>•</span>
            <span className="tabular-nums">
              {formatManilaTimeRange(appointment.starts_at, appointment.ends_at)}
            </span>
            {appointment.is_public && consultant && (
              <>
                <span>•</span>
                <span>{consultant.display_name}</span>
              </>
            )}
          </div>
        </div>
      </button>
      <div className="flex shrink-0 items-center gap-1">
        {isManager && (
          <>
            <Button size="sm" variant="secondary" onClick={onEdit} aria-label="Edit">
              <Pencil size={14} />
            </Button>
            <Button size="sm" variant="secondary" onClick={onDelete} aria-label="Delete">
              <Trash2 size={14} />
            </Button>
          </>
        )}
        {isOwnClient && !appointment.cancellation_requested_by && (
          <Button
            size="sm"
            variant="warning-outline"
            onClick={() => {
              try {
                flagCancellation(profile.id, appointment.id);
                toast.success("Cancellation flagged for Manager review");
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
          >
            <AlertTriangle size={14} /> Flag for Cancellation
          </Button>
        )}
      </div>
    </div>
  );
}

function ConfirmDeleteDialog({
  appointment,
  onClose,
}: {
  appointment: Appointment | null;
  onClose: () => void;
}) {
  const profile = useCurrentProfile();
  return (
    <ResponsiveDialog
      open={!!appointment}
      onOpenChange={(v) => !v && onClose()}
      title="Delete appointment?"
      description="This action cannot be undone."
      size="confirm"
    >
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            if (!appointment || !profile) return;
            try {
              deleteAppointment(profile.id, appointment.id);
              toast.success("Appointment deleted");
              onClose();
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}
        >
          Delete
        </Button>
      </div>
    </ResponsiveDialog>
  );
}

export { dismissCancellationFlag }; // re-export for convenience
