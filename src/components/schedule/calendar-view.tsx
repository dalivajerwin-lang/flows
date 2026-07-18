import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/tenacious-button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { useCurrentProfile } from "@/stores/auth-store";
import { type Appointment, deleteAppointment } from "@/stores/schedule-store";
import {
  dateKeyManila,
  formatManilaLongDate,
  manilaParts,
  monthGridDays,
  todayKeyManila,
  weekDays,
} from "@/lib/schedule-time";
import { cn } from "@/lib/utils";
import { EventChip } from "./event-chip";
import { DayDetailPanel } from "./day-detail-panel";
import { EventDetailDialog } from "./event-detail-dialog";
import { AppointmentFormDialog } from "./appointment-form-dialog";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarView({ appointments }: { appointments: Appointment[] }) {
  const [mode, setMode] = useState<"month" | "week">("month");
  const [anchor, setAnchor] = useState<string>(() => todayKeyManila());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Appointment | null>(null);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<Appointment | null>(null);

  const [ay, am] = anchor.split("-").map(Number);
  const anchorMonth = am;
  const anchorYear = ay;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border)]">
            {(["month", "week"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "px-3 py-1.5 text-sm capitalize",
                  mode === m
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-white text-[var(--color-text)] hover:bg-[var(--color-surface)]",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setAnchor((k) => shiftAnchor(k, mode, -1))}
            aria-label="Previous"
          >
            <ChevronLeft size={16} />
          </Button>
          <div className="min-w-[160px] text-center text-sm font-semibold">
            {mode === "month"
              ? `${MONTH_NAMES[anchorMonth - 1]} ${anchorYear}`
              : weekRangeLabel(anchor)}
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setAnchor((k) => shiftAnchor(k, mode, 1))}
            aria-label="Next"
          >
            <ChevronRight size={16} />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAnchor(todayKeyManila())}>
            Today
          </Button>
        </div>
      </div>

      {mode === "month" ? (
        <MonthGrid
          year={anchorYear}
          month={anchorMonth}
          appointments={appointments}
          onSelectDay={setSelectedDay}
          onSelectEvent={setSelectedEvent}
        />
      ) : (
        <WeekGrid anchor={anchor} appointments={appointments} onSelectEvent={setSelectedEvent} />
      )}

      <DayDetailPanel
        dateKey={selectedDay}
        appointments={
          selectedDay ? appointments.filter((a) => dateKeyManila(a.starts_at) === selectedDay) : []
        }
        onClose={() => setSelectedDay(null)}
        onSelectEvent={(a) => {
          setSelectedDay(null);
          setSelectedEvent(a);
        }}
      />

      <EventDetailDialog
        appointment={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEdit={() => {
          setEditing(selectedEvent);
          setSelectedEvent(null);
        }}
        onDelete={() => {
          setConfirmingDelete(selectedEvent);
          setSelectedEvent(null);
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

function shiftAnchor(key: string, mode: "month" | "week", dir: number): string {
  const [y, m, d] = key.split("-").map(Number);
  if (mode === "month") {
    const nm = m - 1 + dir;
    const dt = new Date(Date.UTC(y, nm, 1));
    const ny = dt.getUTCFullYear();
    const nmo = dt.getUTCMonth() + 1;
    return `${ny}-${String(nmo).padStart(2, "0")}-01`;
  }
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + dir * 7);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

function weekRangeLabel(key: string): string {
  const days = weekDays(key);
  return `${formatManilaLongDate(dayIso(days[0]))} – ${formatManilaLongDate(dayIso(days[6]))}`;
}

function dayIso(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).toISOString();
}

function MonthGrid({
  year,
  month,
  appointments,
  onSelectDay,
  onSelectEvent,
}: {
  year: number;
  month: number;
  appointments: Appointment[];
  onSelectDay: (key: string) => void;
  onSelectEvent: (a: Appointment) => void;
}) {
  const cells = useMemo(() => monthGridDays(year, month), [year, month]);
  const byDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of appointments) {
      const key = dateKeyManila(a.starts_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
    }
    return map;
  }, [appointments]);
  const today = todayKeyManila();

  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
      <div className="grid grid-cols-7 border-b border-[var(--color-border)] bg-[var(--color-surface)] text-center text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="py-2">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell) => {
          const list = byDay.get(cell.key) ?? [];
          const isToday = cell.key === today;
          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => list.length > 0 && onSelectDay(cell.key)}
              className={cn(
                "flex min-h-[92px] flex-col gap-1 border-b border-r border-[var(--color-border)] p-1.5 text-left transition-tenacious",
                !cell.inMonth && "bg-[var(--color-surface)]/60 text-[var(--color-text-secondary)]",
                cell.inMonth && "hover:bg-[var(--color-surface)]",
              )}
              style={isToday ? { backgroundColor: "var(--color-primary-light)" } : undefined}
            >
              <span
                className={cn("text-xs font-semibold tabular-nums")}
                style={isToday ? { color: "var(--color-primary-hover)" } : undefined}
              >
                {cell.day}
              </span>
              <div className="flex flex-col gap-0.5">
                {list.slice(0, 3).map((a) => (
                  <EventChip key={a.id} appointment={a} compact onClick={() => onSelectEvent(a)} />
                ))}
                {list.length > 3 && (
                  <span
                    className="cursor-pointer text-[10px] font-medium text-[var(--color-primary)] hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDay(cell.key);
                    }}
                  >
                    +{list.length - 3} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Week view ----------

const WEEK_START_HOUR = 8;
const WEEK_END_HOUR = 20; // 8 AM – 8 PM
const HOUR_HEIGHT = 48; // px per hour

function WeekGrid({
  anchor,
  appointments,
  onSelectEvent,
}: {
  anchor: string;
  appointments: Appointment[];
  onSelectEvent: (a: Appointment) => void;
}) {
  const days = useMemo(() => weekDays(anchor), [anchor]);
  const today = todayKeyManila();
  const totalHours = WEEK_END_HOUR - WEEK_START_HOUR;
  const height = totalHours * HOUR_HEIGHT;
  const byDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const key of days) map.set(key, []);
    for (const a of appointments) {
      const key = dateKeyManila(a.starts_at);
      if (map.has(key)) map.get(key)!.push(a);
    }
    return map;
  }, [appointments, days]);

  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          {/* Header row */}
          <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] border-b border-[var(--color-border)] bg-[var(--color-surface)]">
            <div />
            {days.map((k) => {
              const [y, m, d] = k.split("-").map(Number);
              const dow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][
                (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7
              ];
              const isToday = k === today;
              return (
                <div
                  key={k}
                  className="border-l border-[var(--color-border)] p-2 text-center text-xs font-semibold"
                  style={
                    isToday
                      ? {
                          backgroundColor: "var(--color-primary-light)",
                          color: "var(--color-primary-hover)",
                        }
                      : undefined
                  }
                >
                  <div>{dow}</div>
                  <div className="text-sm tabular-nums">{d}</div>
                </div>
              );
            })}
          </div>
          {/* Body */}
          <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))]">
            {/* Hour column */}
            <div className="relative" style={{ height }}>
              {Array.from({ length: totalHours + 1 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-full pr-1 text-right text-[10px] text-[var(--color-text-secondary)]"
                  style={{ top: i * HOUR_HEIGHT - 6 }}
                >
                  {formatHour(WEEK_START_HOUR + i)}
                </div>
              ))}
            </div>
            {days.map((k) => (
              <DayColumn
                key={k}
                dateKey={k}
                appointments={byDay.get(k) ?? []}
                onSelectEvent={onSelectEvent}
                totalHours={totalHours}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatHour(h: number): string {
  const suffix = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr} ${suffix}`;
}

function DayColumn({
  dateKey,
  appointments,
  onSelectEvent,
  totalHours,
}: {
  dateKey: string;
  appointments: Appointment[];
  onSelectEvent: (a: Appointment) => void;
  totalHours: number;
}) {
  const height = totalHours * HOUR_HEIGHT;
  // Group overlapping events into lanes.
  const laned = useMemo(() => layoutLanes(appointments), [appointments]);
  const today = todayKeyManila();
  const isToday = dateKey === today;
  return (
    <div
      className="relative border-l border-[var(--color-border)]"
      style={{ height, ...(isToday ? { backgroundColor: "rgba(217,243,243,0.35)" } : {}) }}
    >
      {Array.from({ length: totalHours }).map((_, i) => (
        <div
          key={i}
          className="absolute w-full border-t border-dashed border-[var(--color-border)]"
          style={{ top: i * HOUR_HEIGHT }}
        />
      ))}
      {laned.map(({ appointment, lane, laneCount }) => {
        const start = manilaParts(appointment.starts_at);
        const end = manilaParts(appointment.ends_at);
        const startH = start.hour + start.minute / 60;
        const endH = end.hour + end.minute / 60;
        const top = Math.max(0, startH - WEEK_START_HOUR) * HOUR_HEIGHT;
        const bottom = Math.min(totalHours, endH - WEEK_START_HOUR) * HOUR_HEIGHT;
        const h = Math.max(20, bottom - top);
        const widthPct = 100 / laneCount;
        return (
          <div
            key={appointment.id}
            className="absolute p-0.5"
            style={{
              top,
              height: h,
              left: `${lane * widthPct}%`,
              width: `${widthPct}%`,
            }}
          >
            <EventChip
              appointment={appointment}
              onClick={() => onSelectEvent(appointment)}
              className="h-full items-start"
            />
          </div>
        );
      })}
    </div>
  );
}

interface LanedEvent {
  appointment: Appointment;
  lane: number;
  laneCount: number;
}

function layoutLanes(events: Appointment[]): LanedEvent[] {
  const sorted = [...events].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );
  const results: LanedEvent[] = [];
  // Process clusters of overlapping events.
  let cluster: Appointment[] = [];
  let clusterEnd = 0;
  const flush = () => {
    if (cluster.length === 0) return;
    // Assign lanes greedily.
    const laneEnds: number[] = [];
    const assignments: number[] = [];
    for (const ev of cluster) {
      const s = new Date(ev.starts_at).getTime();
      let placed = -1;
      for (let i = 0; i < laneEnds.length; i++) {
        if (laneEnds[i] <= s) {
          placed = i;
          laneEnds[i] = new Date(ev.ends_at).getTime();
          break;
        }
      }
      if (placed === -1) {
        placed = laneEnds.length;
        laneEnds.push(new Date(ev.ends_at).getTime());
      }
      assignments.push(placed);
    }
    const laneCount = laneEnds.length;
    cluster.forEach((ev, i) => {
      results.push({ appointment: ev, lane: assignments[i], laneCount });
    });
    cluster = [];
    clusterEnd = 0;
  };
  for (const ev of sorted) {
    const s = new Date(ev.starts_at).getTime();
    const e = new Date(ev.ends_at).getTime();
    if (cluster.length === 0 || s < clusterEnd) {
      cluster.push(ev);
      clusterEnd = Math.max(clusterEnd, e);
    } else {
      flush();
      cluster.push(ev);
      clusterEnd = e;
    }
  }
  flush();
  return results;
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
          onClick={async () => {
            if (!appointment || !profile) return;
            try {
              await deleteAppointment(profile.id, appointment.id);
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
