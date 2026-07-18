import { create } from "zustand";
import { supabase, db } from "@/lib/supabase";
import { queryClient } from "@/lib/query-client";
import { useCurrentProfile } from "./auth-store";
import { useAppointments } from "@/hooks/use-appointments";
import { useMemo } from "react";
import {
  APPOINTMENT_TYPE_LABELS,
  isClientAppointment,
  isPublicAppointment,
} from "@/lib/schedule-types";
import {
  dateKeyManila,
  formatManilaLongDate,
  formatManilaTime,
  within24Hours,
} from "@/lib/schedule-time";
import type { Database } from "@/types/supabase";
import { notify, notifyMany } from "@/lib/notify";

export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
export type AppointmentType = string;

// ---------- Scoped selectors — the privacy boundary ----------

export type ScheduleViewer =
  | { role: "manager"; userId: string; agentFilter?: string | null }
  | { role: "property_consultant"; userId: string };

export function filterVisibleAppointments(
  all: Appointment[],
  viewer: ScheduleViewer,
): Appointment[] {
  if (viewer.role === "manager") {
    const agent = viewer.agentFilter;
    if (agent && agent !== "all") {
      return all.filter((a) => a.consultant_id === agent);
    }
    return all;
  }
  // Consultant: own client events + all public manning
  return all.filter((a) => {
    if (a.is_public) return true;
    return a.consultant_id === viewer.userId;
  });
}

export function useScheduleViewer(agentFilter?: string | null): ScheduleViewer | null {
  const profile = useCurrentProfile();
  if (!profile) return null;
  if (profile.role === "property_consultant") {
    return { role: "property_consultant", userId: profile.id };
  }
  return { role: "manager", userId: profile.id, agentFilter: agentFilter ?? null };
}

export function useVisibleAppointments(
  subsystem: "client" | "manning" | "all",
  agentFilter?: string | null,
): Appointment[] {
  const viewer = useScheduleViewer(agentFilter);
  const { data: all = [] } = useAppointments();
  return useMemo(() => {
    if (!viewer) return [];
    const scoped = filterVisibleAppointments(all, viewer);
    if (subsystem === "all") return scoped;
    if (subsystem === "client")
      return scoped.filter((a) => isClientAppointment(a.appointment_type));
    return scoped.filter((a) => isPublicAppointment(a.appointment_type));
  }, [all, viewer, subsystem]);
}

export function groupByDateKey(appts: Appointment[]): Map<string, Appointment[]> {
  const sorted = [...appts].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );
  const map = new Map<string, Appointment[]>();
  for (const a of sorted) {
    const key = dateKeyManila(a.starts_at);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  }
  return map;
}

// ---------- Mutations ----------

export interface CreateAppointmentInput {
  appointment_type: AppointmentType;
  consultant_id: string;
  lead_id: string | null;
  project_id: string | null;
  title: string;
  location: string;
  notes: string;
  starts_at: string;
  ends_at: string;
}

// Notifications go through the central dispatcher (src/lib/notify.ts) so
// every write carries the Priority Matrix layers.

async function logLeadActivity(
  leadId: string,
  actorId: string,
  kind: string,
  summary: string,
  startsAt: string,
  appointmentId: string,
  apptType: string,
) {
  await db.from("audit_trail").insert({
    lead_id: leadId,
    actor_id: actorId,
    type: kind,
    summary,
    meta: { appointment_id: appointmentId, appointment_type: apptType, scheduled_at: startsAt },
  });
}

export async function createAppointment(
  actorId: string,
  input: CreateAppointmentInput,
): Promise<Appointment> {
  if (new Date(input.ends_at).getTime() <= new Date(input.starts_at).getTime()) {
    throw new Error("End time must be after start time.");
  }
  if (isClientAppointment(input.appointment_type) && !input.lead_id) {
    throw new Error("Client appointments require a lead.");
  }

  const isPub = isPublicAppointment(input.appointment_type);

  const { data: apt, error } = await db
    .from("appointments")
    .insert({
      appointment_type: input.appointment_type,
      consultant_id: input.consultant_id,
      lead_id: input.lead_id || null,
      project_id: input.project_id || null,
      title: input.title,
      location: input.location,
      notes: input.notes,
      starts_at: input.starts_at,
      ends_at: input.ends_at,
      is_public: isPub,
      created_by: actorId,
    })
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);

  await notify(input.consultant_id, "schedule_added", {
    title: "New appointment added",
    body: `A new appointment has been added to your schedule: ${APPOINTMENT_TYPE_LABELS[input.appointment_type]} on ${formatManilaLongDate(input.starts_at)}.`,
    deep_link_path: "/schedule",
    lead_id: apt.lead_id ?? null,
  });

  if (apt.lead_id) {
    await logLeadActivity(
      apt.lead_id,
      actorId,
      "appointment_scheduled",
      `Scheduled ${APPOINTMENT_TYPE_LABELS[apt.appointment_type]} on ${formatManilaLongDate(apt.starts_at)} at ${formatManilaTime(apt.starts_at)}`,
      apt.starts_at,
      apt.id,
      apt.appointment_type,
    );
  }

  queryClient.invalidateQueries({ queryKey: ["appointments"] });
  return apt as Appointment;
}

export async function updateAppointment(
  actorId: string,
  id: string,
  patch: Partial<CreateAppointmentInput>,
): Promise<void> {
  const { data: existing, error: fetchErr } = await db
    .from("appointments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !existing) throw new Error("Appointment not found.");

  const merged = { ...existing, ...patch };
  if (patch.appointment_type) merged.is_public = isPublicAppointment(patch.appointment_type);

  if (new Date(merged.ends_at).getTime() <= new Date(merged.starts_at).getTime()) {
    throw new Error("End time must be after start time.");
  }

  const { error: updateErr } = await db
    .from("appointments")
    .update({
      ...patch,
      is_public: merged.is_public,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateErr) throw new Error(updateErr.message);

  const label = merged.lead_id ? merged.title : merged.location;

  await notify(merged.consultant_id, "schedule_updated", {
    title: "Appointment updated",
    body: `Your appointment for ${label} on ${formatManilaLongDate(merged.starts_at)} has been updated.`,
    deep_link_path: "/schedule",
    lead_id: merged.lead_id ?? null,
  });

  if (merged.lead_id) {
    await logLeadActivity(
      merged.lead_id,
      actorId,
      "appointment_updated",
      `Updated ${APPOINTMENT_TYPE_LABELS[merged.appointment_type]} on ${formatManilaLongDate(merged.starts_at)}`,
      merged.starts_at,
      merged.id,
      merged.appointment_type,
    );
  }

  queryClient.invalidateQueries({ queryKey: ["appointments"] });
  queryClient.invalidateQueries({ queryKey: ["appointment", id] });
}

export async function deleteAppointment(actorId: string, id: string): Promise<void> {
  const { data: existing } = await db.from("appointments").select("*").eq("id", id).maybeSingle();
  if (!existing) return;

  const { error } = await db.from("appointments").delete().eq("id", id);
  if (error) throw new Error(error.message);

  if (existing.lead_id) {
    await logLeadActivity(
      existing.lead_id,
      actorId,
      "appointment_cancelled",
      `Cancelled ${APPOINTMENT_TYPE_LABELS[existing.appointment_type]} on ${formatManilaLongDate(existing.starts_at)}`,
      existing.starts_at,
      existing.id,
      existing.appointment_type,
    );
  }

  queryClient.invalidateQueries({ queryKey: ["appointments"] });
}

export async function flagCancellation(actorId: string, appointmentId: string): Promise<void> {
  const { data: apt } = await db
    .from("appointments")
    .select("*")
    .eq("id", appointmentId)
    .maybeSingle();
  if (!apt) throw new Error("Appointment not found.");
  if (apt.consultant_id !== actorId) {
    throw new Error("You can only flag your own appointments.");
  }
  if (!isClientAppointment(apt.appointment_type)) {
    throw new Error("Only client appointments can be flagged for cancellation.");
  }

  const { error } = await db
    .from("appointments")
    .update({
      cancellation_requested_by: actorId,
      cancellation_requested_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", appointmentId);

  if (error) throw new Error(error.message);

  const { data: profile } = await db
    .from("profiles")
    .select("display_name")
    .eq("id", actorId)
    .maybeSingle();
  const { data: managers = [] } = await db
    .from("profiles")
    .select("id")
    .neq("role", "property_consultant");

  await notifyMany(
    (managers as { id: string }[]).map((m) => m.id),
    "schedule_cancellation_requested",
    {
      title: "Cancellation requested",
      body: `${profile?.display_name ?? "A consultant"} requested cancellation of ${APPOINTMENT_TYPE_LABELS[apt.appointment_type]} on ${formatManilaLongDate(apt.starts_at)}.`,
      deep_link_path: "/schedule",
      lead_id: apt.lead_id ?? null,
    },
  );

  queryClient.invalidateQueries({ queryKey: ["appointments"] });
  queryClient.invalidateQueries({ queryKey: ["appointment", appointmentId] });
}

export async function dismissCancellationFlag(
  actorId: string,
  appointmentId: string,
): Promise<void> {
  const { error } = await db
    .from("appointments")
    .update({
      cancellation_requested_by: null,
      cancellation_requested_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", appointmentId);

  if (error) throw new Error(error.message);

  queryClient.invalidateQueries({ queryKey: ["appointments"] });
  queryClient.invalidateQueries({ queryKey: ["appointment", appointmentId] });
}

// ---------- 24-hour reminder sweep ----------

interface ReminderState {
  lastSweepAt: number;
  sweep: () => Promise<void>;
}

export const useReminderSweep = create<ReminderState>((set, get) => ({
  lastSweepAt: 0,
  sweep: async () => {
    const now = Date.now();
    if (now - get().lastSweepAt < 60_000) return;
    set({ lastSweepAt: now });

    const { data: appointments = [] } = await db
      .from("appointments")
      .select("*")
      .is("reminder_sent_at", null);

    for (const a of appointments as Appointment[]) {
      if (!within24Hours(a.starts_at)) continue;

      let clientName = a.title;
      if (a.lead_id) {
        const { data: lead } = await db
          .from("leads")
          .select("full_name")
          .eq("id", a.lead_id)
          .maybeSingle();
        if (lead) clientName = lead.full_name;
      }

      await db
        .from("appointments")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", a.id);

      await notify(a.consultant_id, "schedule_reminder", {
        title: "Upcoming appointment",
        body: `Reminder: ${APPOINTMENT_TYPE_LABELS[a.appointment_type]} with ${clientName} is coming up at ${formatManilaTime(a.starts_at)}.`,
        deep_link_path: "/schedule",
        lead_id: a.lead_id ?? null,
      });
    }

    queryClient.invalidateQueries({ queryKey: ["appointments"] });
  },
}));
