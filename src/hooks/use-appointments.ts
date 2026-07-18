/**
 * Appointments React Query hooks.
 * Communicate directly with Supabase table `appointments`.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

export function useAppointments(filters?: {
  consultantId?: string;
  leadId?: string;
  project_id?: string;
  isPublic?: boolean;
}) {
  return useQuery<Appointment[]>({
    queryKey: ["appointments", filters],
    queryFn: async () => {
      let q = db.from("appointments").select("*").order("starts_at", { ascending: true });

      if (filters?.consultantId) {
        q = q.eq("consultant_id", filters.consultantId);
      }
      if (filters?.leadId) {
        q = q.eq("lead_id", filters.leadId);
      }
      if (filters?.project_id) {
        q = q.eq("project_id", filters.project_id);
      }
      if (filters?.isPublic !== undefined) {
        q = q.eq("is_public", filters.isPublic);
      }

      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return data as Appointment[];
    },
  });
}

export function useAppointment(id: string | null) {
  return useQuery<Appointment | null>({
    queryKey: ["appointment", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await db.from("appointments").select("*").eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return data as Appointment | null;
    },
  });
}

export function useAddAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Appointment, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await db.from("appointments").insert(payload).select().maybeSingle();
      if (error) throw new Error(error.message);
      return data as Appointment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Appointment> }) => {
      const { data, error } = await db
        .from("appointments")
        .update({
          ...patch,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as Appointment;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      if (data?.id) {
        qc.setQueryData(["appointment", data.id], data);
      }
    },
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("appointments").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useRequestAppointmentCancellation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, actorId }: { id: string; actorId: string }) => {
      const { data, error } = await db
        .from("appointments")
        .update({
          cancellation_requested_by: actorId,
          cancellation_requested_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as Appointment;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      if (data?.id) {
        qc.setQueryData(["appointment", data.id], data);
      }
    },
  });
}

export function useDismissAppointmentCancellation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await db
        .from("appointments")
        .update({
          cancellation_requested_by: null,
          cancellation_requested_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as Appointment;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      if (data?.id) {
        qc.setQueryData(["appointment", data.id], data);
      }
    },
  });
}
