import { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useCurrentProfile } from "@/stores/auth-store";
import { useProfiles } from "@/hooks/use-profiles";
import { useVisibleAppointments, useReminderSweep } from "@/stores/schedule-store";
import { useTicker } from "@/stores/ticker-store";
import { Button } from "@/components/ui/tenacious-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ListView } from "./list-view";
import { CalendarView } from "./calendar-view";
import { ColorLegend } from "./color-legend";
import { AppointmentFormDialog } from "./appointment-form-dialog";

type ViewMode = "list" | "calendar";
type Subsystem = "client" | "manning";

export function SchedulePage() {
  const profile = useCurrentProfile();
  const { data: allProfiles = [] } = useProfiles();
  const consultants = allProfiles.filter((p) => p.role === "property_consultant");
  const [view, setView] = useState<ViewMode>("calendar");
  const [subsystem, setSubsystem] = useState<Subsystem>("manning");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [creating, setCreating] = useState(false);
  const sweep = useReminderSweep((s) => s.sweep);

  // Initial sweep + minute-boundary sweeps driven by the app-wide ticker (no local setInterval).
  const tickNow = useTicker((s) => s.now);
  const lastMinuteRef = useRef<number>(-1);
  useEffect(() => {
    sweep();
  }, [sweep]);
  useEffect(() => {
    if (!tickNow) return;
    const minute = Math.floor(tickNow / 60_000);
    if (minute !== lastMinuteRef.current) {
      lastMinuteRef.current = minute;
      sweep();
    }
  }, [tickNow, sweep]);

  const isManager = !!profile && profile.role !== "property_consultant";
  const appointments = useVisibleAppointments(subsystem, isManager ? agentFilter : null);

  const totals = useMemo(() => appointments.length, [appointments]);

  if (!profile) return null;

  return (
    <div className="space-y-4">
      <div className="hidden sm:block">
        <h1 className="text-[22px] font-semibold sm:text-3xl">Schedule</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {totals} appointment{totals === 1 ? "" : "s"} visible
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
        <div className="inline-flex overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border)]">
          {(["list", "calendar"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setView(m)}
              className={cn(
                "px-3 py-1.5 text-sm capitalize",
                view === m
                  ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                  : "bg-[var(--color-background)] text-[var(--color-text)] hover:bg-[var(--color-surface)]",
              )}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="inline-flex overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border)]">
          {(
            [
              ["client", "My Appointments"],
              ["manning", "Manning & Booth Duty"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setSubsystem(k)}
              className={cn(
                "flex-1 px-3 py-1.5 text-sm",
                subsystem === k
                  ? "bg-[var(--color-primary-light)] text-[var(--color-primary-hover)] font-semibold"
                  : "bg-[var(--color-background)] text-[var(--color-text)] hover:bg-[var(--color-surface)]",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 justify-self-end">
          {isManager && (
            <div className="min-w-[160px]">
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {consultants.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {isManager && (
            <Button onClick={() => setCreating(true)}>
              <Plus size={16} /> New Appointment
            </Button>
          )}
        </div>
      </div>

      <ColorLegend />

      {view === "list" ? (
        <ListView
          appointments={appointments}
          subsystem={subsystem}
          isManager={isManager}
          onCreate={() => setCreating(true)}
        />
      ) : (
        <CalendarView appointments={appointments} />
      )}

      <AppointmentFormDialog open={creating} editing={null} onOpenChange={setCreating} />
    </div>
  );
}
