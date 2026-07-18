import { AlertTriangle } from "lucide-react";
import type { Appointment } from "@/stores/schedule-store";
import { APPOINTMENT_TYPE_COLORS } from "@/lib/schedule-types";
import { formatManilaTime } from "@/lib/schedule-time";
import { cn } from "@/lib/utils";

export function EventChip({
  appointment,
  onClick,
  compact = false,
  className,
}: {
  appointment: Appointment;
  onClick?: () => void;
  compact?: boolean;
  className?: string;
}) {
  const color = APPOINTMENT_TYPE_COLORS[appointment.appointment_type];
  return (
    <button
      type="button"
      onClick={onClick}
      title={appointment.title}
      className={cn(
        "flex w-full items-center gap-1 truncate rounded-[var(--radius-sm)] px-1.5 text-left text-white transition-tenacious hover:brightness-110",
        compact ? "py-0.5 text-[10px]" : "py-1 text-xs",
        className,
      )}
      style={{ backgroundColor: color }}
    >
      {appointment.cancellation_requested_by && (
        <AlertTriangle size={compact ? 10 : 12} className="shrink-0" />
      )}
      {!compact && (
        <span className="tabular-nums opacity-90">{formatManilaTime(appointment.starts_at)}</span>
      )}
      <span className="truncate font-medium">{appointment.title}</span>
    </button>
  );
}

export function ColorDot({ type }: { type: Appointment["appointment_type"] }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
      style={{ backgroundColor: APPOINTMENT_TYPE_COLORS[type] }}
    />
  );
}
