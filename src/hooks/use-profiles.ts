/**
 * useProfiles — fetch all profiles (for team lists, assignment dropdowns, etc.)
 * useProfile  — fetch a single profile by id
 * useUpdateProfile — update own profile fields
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/supabase";
import type { Profile } from "@/stores/auth-store";

// ─── Query: all profiles ──────────────────────────────────────────────────────
export function useProfiles() {
  return useQuery<Profile[]>({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await db
        .from("profiles")
        .select("*")
        .eq("is_active", true)
        .order("display_name");
      if (error) throw new Error(error.message);
      return data as Profile[];
    },
  });
}

export function useAllProfiles() {
  return useQuery<Profile[]>({
    queryKey: ["profiles", "all"],
    queryFn: async () => {
      const { data, error } = await db.from("profiles").select("*").order("display_name");
      if (error) throw new Error(error.message);
      return data as Profile[];
    },
  });
}

// ─── Query: single profile ────────────────────────────────────────────────────
export function useProfile(id: string | null) {
  return useQuery<Profile | null>({
    queryKey: ["profile", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await db.from("profiles").select("*").eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return data as Profile | null;
    },
  });
}

// ─── Mutation: update profile ─────────────────────────────────────────────────
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Profile> }) => {
      const { data, error } = await db
        .from("profiles")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as Profile;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["profiles"] });
      qc.setQueryData(["profile", data.id], data);
    },
  });
}
