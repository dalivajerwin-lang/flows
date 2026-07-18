import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Check, Pencil, Trash2, X } from "lucide-react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/tenacious-button";
import { useCurrentProfile } from "@/stores/auth-store";
import { useProfiles } from "@/hooks/use-profiles";
import { useProjects } from "@/hooks/use-projects";
import { useLead } from "@/stores/leads-store";
import { type Appointment } from "@/stores/schedule-store";
import { dismissCancellationFlag, flagCancellation } from "@/stores/schedule-store";
import {
  APPOINTMENT_TYPE_LABELS,
  APPOINTMENT_TYPE_COLORS,
  isClientAppointment,
} from "@/lib/schedule-types";
import { formatManilaFullDate, formatManilaTimeRange } from "@/lib/schedule-time";

export function EventDetailDialog({
  appointment,
  onClose,
  onEdit,
  onDelete,
}: {
  appointment: Appointment | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const profile = useCurrentProfile();
  const { data: profiles = [] } = useProfiles();
  const { data: projects = [] } = useProjects();
  const lead = useLead(appointment?.lead_id ?? null);
  if (!appointment) return null;
  const isManager = profile?.role !== "property_consultant";
  const isOwnClient =
    !!profile &&
    profile.role === "property_consultant" &&
    isClientAppointment(appointment.appointment_type) &&
    appointment.consultant_id === profile.id;
  const consultant = profiles.find((p) => p.id === appointment.consultant_id);
  const project = appointment.project_id
    ? (projects.find((p) => p.id === appointment.project_id) ?? null)
    : null;
  const color = APPOINTMENT_TYPE_COLORS[appointment.appointment_type];

  return (
    <ResponsiveDialog
      open={!!appointment}
      onOpenChange={(v) => !v && onClose()}
      title={appointment.title}
    >
      <div className="space-y-4">
        <div>
          <span
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: color }}
          >
            {APPOINTMENT_TYPE_LABELS[appointment.appointment_type]}
          </span>
          {appointment.cancellation_requested_by && (
            <StatusChip variant="warning" className="ml-2">
              <AlertTriangle size={12} className="mr-1" /> Cancellation requested
            </StatusChip>
          )}
        </div>

        <dl className="grid grid-cols-3 gap-y-2 text-sm">
          <dt className="col-span-1 text-[var(--color-text-secondary)]">Date</dt>
          <dd className="col-span-2 font-medium">{formatManilaFullDate(appointment.starts_at)}</dd>

          <dt className="col-span-1 text-[var(--color-text-secondary)]">Time</dt>
          <dd className="col-span-2 font-medium tabular-nums">
            {formatManilaTimeRange(appointment.starts_at, appointment.ends_at)}
          </dd>

          <dt className="col-span-1 text-[var(--color-text-secondary)]">Consultant</dt>
          <dd className="col-span-2 font-medium">{consultant?.display_name ?? "—"}</dd>

          {lead && (
            <>
              <dt className="col-span-1 text-[var(--color-text-secondary)]">Client</dt>
              <dd className="col-span-2 font-medium">{lead.full_name}</dd>
            </>
          )}

          <dt className="col-span-1 text-[var(--color-text-secondary)]">Location</dt>
          <dd className="col-span-2 font-medium">{appointment.location || "—"}</dd>

          {project && (
            <>
              <dt className="col-span-1 text-[var(--color-text-secondary)]">Project</dt>
              <dd className="col-span-2 font-medium">{project.name}</dd>
            </>
          )}

          {appointment.notes && (
            <>
              <dt className="col-span-1 text-[var(--color-text-secondary)]">Notes</dt>
              <dd className="col-span-2 whitespace-pre-wrap">{appointment.notes}</dd>
            </>
          )}
        </dl>

        <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--color-border)] pt-3">
          {isManager && appointment.cancellation_requested_by && (
            <Button
              variant="secondary"
              onClick={() => {
                if (!profile) return;
                try {
                  dismissCancellationFlag(profile.id, appointment.id);
                  toast.success("Cancellation request dismissed");
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
            >
              <X size={16} /> Dismiss request
            </Button>
          )}
          {isManager && (
            <>
              <Button variant="secondary" onClick={onEdit}>
                <Pencil size={16} /> Edit
              </Button>
              <Button variant="destructive" onClick={onDelete}>
                <Trash2 size={16} /> Delete
              </Button>
            </>
          )}
          {isOwnClient && !appointment.cancellation_requested_by && (
            <Button
              variant="warning-outline"
              onClick={() => {
                if (!profile) return;
                try {
                  flagCancellation(profile.id, appointment.id);
                  toast.success("Cancellation flagged for Manager review");
                  onClose();
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
            >
              <AlertTriangle size={16} /> Flag for Cancellation
            </Button>
          )}
          {isOwnClient && appointment.cancellation_requested_by && (
            <StatusChip variant="info">
              <Check size={12} className="mr-1" /> Awaiting Manager review
            </StatusChip>
          )}
        </div>
      </div>
    </ResponsiveDialog>
  );
}
