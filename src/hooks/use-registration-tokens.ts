import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

export type RegistrationToken = Database["public"]["Tables"]["registration_tokens"]["Row"];
export type InsertRegistrationToken = Database["public"]["Tables"]["registration_tokens"]["Insert"];
export type SystemSettings = Database["public"]["Tables"]["system_settings"]["Row"];

// Fetch all registration tokens (manager/superadmin only)
export function useRegistrationTokens() {
  return useQuery<RegistrationToken[]>({
    queryKey: ["registration_tokens"],
    queryFn: async () => {
      const { data, error } = await db
        .from("registration_tokens")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data as RegistrationToken[];
    },
  });
}

// Create a new registration token
export function useCreateRegistrationToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      tokenData: Omit<InsertRegistrationToken, "created_by"> & { created_by: string },
    ) => {
      const { data, error } = await db
        .from("registration_tokens")
        .insert(tokenData)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as RegistrationToken;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["registration_tokens"] });
    },
  });
}

// Fetch system settings
export function useSystemSettings() {
  return useQuery<SystemSettings>({
    queryKey: ["system_settings"],
    queryFn: async () => {
      const { data, error } = await db
        .from("system_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) {
        // Fallback fallback settings
        return {
          id: 1,
          company_timezone: "Asia/Manila",
          registration_locked: false,
          onboarding_enabled: true,
        };
      }
      return data as SystemSettings;
    },
  });
}

// Update system settings (superadmin only). Goes through the audited
// admin_update_system_settings RPC so every toggle lands in audit_trail.
export function useUpdateSystemSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Pick<SystemSettings, "registration_locked" | "onboarding_enabled">>) => {
      const { error } = await db.rpc("admin_update_system_settings", {
        p_registration_locked: patch.registration_locked ?? null,
        p_onboarding_enabled: patch.onboarding_enabled ?? null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["system_settings"] });
    },
  });
}
