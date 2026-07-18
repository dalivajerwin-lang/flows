import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/tenacious-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { useCurrentProfile } from "@/stores/auth-store";
import { useProfiles } from "@/hooks/use-profiles";
import { useProjects } from "@/hooks/use-projects";
import { useLeads } from "@/hooks/use-leads";
import { type Appointment } from "@/stores/schedule-store";
import {
  APPOINTMENT_TYPE_LABELS,
  CLIENT_APPOINTMENT_TYPES,
  PUBLIC_APPOINTMENT_TYPES,
  isClientAppointment,
} from "@/lib/schedule-types";
import { createAppointment, updateAppointment } from "@/stores/schedule-store";
import {
  dateKeyManila,
  isoToManilaHhmm,
  manilaDateTimeToIso,
  todayKeyManila,
} from "@/lib/schedule-time";

type AppointmentType = string;

interface FormState {
  appointment_type: AppointmentType;
  consultant_id: string;
  consultant_ids: string[];
  lead_id: string;
  project_id: string;
  title: string;
  location: string;
  date: string; // yyyy-mm-dd
  start: string; // HH:MM
  end: string; // HH:MM
  notes: string;
}

function initFor(a: Appointment | null): FormState {
  if (a) {
    return {
      appointment_type: a.appointment_type,
      consultant_id: a.consultant_id,
      consultant_ids: [a.consultant_id],
      lead_id: a.lead_id ?? "",
      project_id: a.project_id ?? "",
      title: a.title,
      location: a.location,
      date: dateKeyManila(a.starts_at),
      start: isoToManilaHhmm(a.starts_at),
      end: isoToManilaHhmm(a.ends_at),
      notes: a.notes,
    };
  }
  return {
    appointment_type: "manning_duty",
    consultant_id: "",
    consultant_ids: [],
    lead_id: "",
    project_id: "",
    title: "",
    location: "",
    date: todayKeyManila(),
    start: "09:00",
    end: "10:00",
    notes: "",
  };
}

export function AppointmentFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Appointment | null;
}) {
  const profile = useCurrentProfile();
  const { data: profiles = [] } = useProfiles();
  const { data: projects = [] } = useProjects();
  const { data: allLeads = [] } = useLeads();
  const [state, setState] = useState<FormState>(() => initFor(editing));

  useEffect(() => {
    if (open) setState(initFor(editing));
  }, [open, editing]);

  const consultants = useMemo(
    () => profiles.filter((p) => p.role === "property_consultant" && p.is_active),
    [profiles],
  );
  const availableLeads = useMemo(() => {
    if (!state.consultant_id) return [];
    return allLeads
      .filter((l) => !l.deleted_at && l.assigned_to === state.consultant_id)
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [allLeads, state.consultant_id]);
  const isClient = isClientAppointment(state.appointment_type);
  // Managers can no longer create client trippings/presentations for a
  // consultant — those are booked by the consultant from the lead workflow.
  // The dialog only offers client types when editing an existing client
  // appointment; new appointments are manning/booth duty only.
  const editingClient = !!editing && isClientAppointment(editing.appointment_type);
  const typeOptions = editingClient ? CLIENT_APPOINTMENT_TYPES : PUBLIC_APPOINTMENT_TYPES;

  if (!profile) return null;
  const isManager = profile.role !== "property_consultant";
  if (!isManager) return null;

  const save = async () => {
    if (isClient && !editing) {
      toast.error("Client trippings and presentations are booked from the lead's workflow.");
      return;
    }
    const isMultiAgent = !isClient && !editing;
    const targetAgents = isMultiAgent ? state.consultant_ids : [state.consultant_id];

    if (targetAgents.length === 0 || (targetAgents.length === 1 && !targetAgents[0])) {
      toast.error("Please assign at least one consultant.");
      return;
    }
    if (isClient && !state.lead_id) {
      toast.error("Client appointments require a lead.");
      return;
    }
    const startsAt = manilaDateTimeToIso(state.date, state.start);
    const endsAt = manilaDateTimeToIso(state.date, state.end);
    if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
      toast.error("End time must be after start time.");
      return;
    }
    const lead = isClient ? allLeads.find((l) => l.id === state.lead_id) : null;
    const title = isClient ? (lead?.full_name ?? state.title) : state.title || state.location;
    try {
      if (editing) {
        await updateAppointment(profile.id, editing.id, {
          appointment_type: state.appointment_type,
          consultant_id: state.consultant_id,
          lead_id: isClient ? state.lead_id : null,
          project_id: state.project_id || (lead?.project_id ?? null),
          title,
          location: state.location,
          notes: state.notes,
          starts_at: startsAt,
          ends_at: endsAt,
        });
        toast.success("Appointment updated");
      } else {
        for (const consultantId of targetAgents) {
          await createAppointment(profile.id, {
            appointment_type: state.appointment_type,
            consultant_id: consultantId,
            lead_id: isClient ? state.lead_id : null,
            project_id: state.project_id || (lead?.project_id ?? null),
            title,
            location: state.location,
            notes: state.notes,
            starts_at: startsAt,
            ends_at: endsAt,
          });
        }
        toast.success(
          targetAgents.length > 1
            ? `Created ${targetAgents.length} appointments`
            : "Appointment created",
        );
      }
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit Appointment" : "New Appointment"}
      size="form"
    >
      <div className="space-y-3">
        <div>
          <Label>Type</Label>
          <Select
            value={state.appointment_type}
            onValueChange={(v) => {
              const newIsClient = isClientAppointment(v);
              setState((s) => {
                let nextId = s.consultant_id;
                let nextIds = s.consultant_ids;

                if (newIsClient) {
                  if (!nextId && nextIds.length > 0) {
                    nextId = nextIds[0];
                  }
                  return { ...s, appointment_type: v, consultant_id: nextId, lead_id: "" };
                } else {
                  if (nextId && !nextIds.includes(nextId)) {
                    nextIds = [...nextIds, nextId];
                  }
                  return { ...s, appointment_type: v, consultant_ids: nextIds };
                }
              });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((t) => (
                <SelectItem key={t} value={t}>
                  {APPOINTMENT_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!isClient && !editing ? (
          <div>
            <Label className="flex justify-between items-center mb-1.5">
              <span>Assign to consultants (select one or more)</span>
              {state.consultant_ids.length > 0 && (
                <button
                  type="button"
                  onClick={() => setState((s) => ({ ...s, consultant_ids: [] }))}
                  className="text-xs text-[var(--color-primary)] hover:underline"
                >
                  Clear all
                </button>
              )}
            </Label>
            <div className="border border-[var(--color-border)] rounded-[var(--radius-sm)] p-3 max-h-[160px] overflow-y-auto space-y-2.5 bg-white">
              {consultants.map((c) => {
                const isChecked = state.consultant_ids.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className="flex items-center gap-2.5 text-sm font-medium cursor-pointer select-none text-[var(--color-text)] hover:text-[var(--color-primary)]"
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        setState((s) => {
                          const ids = checked
                            ? [...s.consultant_ids, c.id]
                            : s.consultant_ids.filter((id) => id !== c.id);
                          return { ...s, consultant_ids: ids };
                        });
                      }}
                    />
                    <span>{c.display_name}</span>
                  </label>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              {state.consultant_ids.length} consultant{state.consultant_ids.length === 1 ? "" : "s"}{" "}
              selected.
            </p>
          </div>
        ) : (
          <div>
            <Label>Assign to consultant</Label>
            <Select
              value={state.consultant_id}
              onValueChange={(v) =>
                setState((s) => ({ ...s, consultant_id: v, lead_id: "", consultant_ids: [v] }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a consultant" />
              </SelectTrigger>
              <SelectContent>
                {consultants.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {isClient ? (
          <div>
            <Label>Lead</Label>
            <Select
              value={state.lead_id}
              onValueChange={(v) => setState((s) => ({ ...s, lead_id: v }))}
              disabled={!state.consultant_id}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={state.consultant_id ? "Select a lead" : "Assign a consultant first"}
                />
              </SelectTrigger>
              <SelectContent>
                {availableLeads.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Booth or location name</Label>
            <div className="flex flex-wrap gap-1.5">
              {["Sonora Booth", "Sonora Office", "SM Laspiñas Booth"].map((booth) => {
                const isSelected = state.title === booth;
                return (
                  <button
                    key={booth}
                    type="button"
                    onClick={() => setState((s) => ({ ...s, title: booth }))}
                    className={cn(
                      "inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs transition-all duration-200 border",
                      isSelected
                        ? "bg-[var(--color-primary-light)] text-[var(--color-primary-hover)] border-[var(--color-primary-hover)] font-semibold shadow-sm"
                        : "bg-white text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]",
                    )}
                  >
                    {booth}
                  </button>
                );
              })}
              {state.title &&
                !["Sonora Booth", "Sonora Office", "SM Laspiñas Booth"].includes(state.title) && (
                  <span className="inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs border bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] italic">
                    Custom: {state.title}
                  </span>
                )}
            </div>
            <Input
              value={state.title}
              onChange={(e) => setState((s) => ({ ...s, title: e.target.value }))}
              placeholder="Or type another booth/location name..."
            />
          </div>
        )}

        <div>
          <Label>Location</Label>
          <Input
            value={state.location}
            onChange={(e) => setState((s) => ({ ...s, location: e.target.value }))}
            placeholder="Model unit / showroom / address"
          />
        </div>

        <div>
          <Label>Project target</Label>
          <Select
            value={state.project_id || "__none"}
            onValueChange={(v) => setState((s) => ({ ...s, project_id: v === "__none" ? "" : v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">None</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={state.date}
              onChange={(e) => setState((s) => ({ ...s, date: e.target.value }))}
            />
          </div>
          <div>
            <Label>Start time</Label>
            <Input
              type="time"
              value={state.start}
              onChange={(e) => setState((s) => ({ ...s, start: e.target.value }))}
            />
          </div>
          <div>
            <Label>End time</Label>
            <Input
              type="time"
              value={state.end}
              onChange={(e) => setState((s) => ({ ...s, end: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <Label>Notes</Label>
          <Textarea
            value={state.notes}
            onChange={(e) => setState((s) => ({ ...s, notes: e.target.value }))}
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>{editing ? "Save changes" : "Create appointment"}</Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
