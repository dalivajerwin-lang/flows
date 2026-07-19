import { useEffect } from "react";
import { X } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useCurrentProfile } from "@/stores/auth-store";
import { useProfiles } from "@/hooks/use-profiles";
import { type Appointment } from "@/stores/schedule-store";
import { APPOINTMENT_TYPE_LABELS, APPOINTMENT_TYPE_COLORS } from "@/lib/schedule-types";
import { dateGroupLabel, formatManilaTimeRange } from "@/lib/schedule-time";
import { cn } from "@/lib/utils";

export function DayDetailPanel({
  dateKey,
  appointments,
  onClose,
  onSelectEvent,
}: {
  dateKey: string | null;
  appointments: Appointment[];
  onClose: () => void;
  onSelectEvent: (a: Appointment) => void;
}) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  useEffect(() => {
    if (!dateKey) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dateKey, onClose]);
  const { data: profiles = [] } = useProfiles();
  const profile = useCurrentProfile();
  if (!dateKey) return null;

  const content = (
    <>
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <div>
          <h3 className="text-base font-semibold">{dateGroupLabel(dateKey)}</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {appointments.length} appointment{appointments.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="rounded-[var(--radius-sm)] p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
        >
          <X size={18} />
        </button>
      </div>
      <div className="max-h-[60vh] space-y-2 overflow-auto p-3">
        {appointments.map((a) => {
          const color = APPOINTMENT_TYPE_COLORS[a.appointment_type];
          const consultant = profiles.find((p) => p.id === a.consultant_id);
          const isPublic = a.is_public;
          const canSeeConsultant = profile?.role !== "property_consultant" || isPublic;
          return (
            <button
              key={a.id}
              onClick={() => onSelectEvent(a)}
              className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-start gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] p-2 text-left transition-tenacious hover:bg-[var(--color-surface)]"
            >
              <span
                className="mt-1 h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{a.title}</div>
                <div className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                  {APPOINTMENT_TYPE_LABELS[a.appointment_type]} •{" "}
                  {formatManilaTimeRange(a.starts_at, a.ends_at)}
                  {canSeeConsultant && consultant ? ` • ${consultant.display_name}` : ""}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );

  if (isDesktop) {
    return (
      <div className="fixed inset-0 z-40" onClick={onClose}>
        <div className="absolute inset-0 bg-[rgba(0,0,0,0.32)]" />
        <div
          className="absolute right-6 top-24 w-[360px] rounded-[var(--radius-md)] bg-[var(--color-background)] shadow-[var(--shadow-md)]"
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 z-40 flex" onClick={onClose}>
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.32)]" />
      <div
        className={cn(
          "relative mt-auto w-full rounded-t-[var(--radius-lg)] bg-[var(--color-background)] shadow-[var(--shadow-md)]",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2">
          <div className="h-1.5 w-10 rounded-full bg-[var(--color-border)]" />
        </div>
        {content}
      </div>
    </div>
  );
}
