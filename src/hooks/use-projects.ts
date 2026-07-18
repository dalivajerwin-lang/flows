/**
 * useProjects — fetch all active projects
 * useUpsertProject — create or update a project (manager/superadmin only)
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/supabase";

export interface Project {
  id: string;
  name: string;
  developer: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

// ─── Query: all active projects ───────────────────────────────────────────────
export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await db
        .from("projects")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw new Error(error.message);
      return data as Project[];
    },
  });
}

// ─── Query: all projects including inactive ────────────────────────────────────
export function useAllProjects() {
  return useQuery<Project[]>({
    queryKey: ["projects", "all"],
    queryFn: async () => {
      const { data, error } = await db.from("projects").select("*").order("sort_order");
      if (error) throw new Error(error.message);
      return data as Project[];
    },
  });
}

// ─── Mutation: upsert project ─────────────────────────────────────────────────
export function useUpsertProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (project: Partial<Project>) => {
      const { data, error } = project.id
        ? await db.from("projects").update(project).eq("id", project.id).select().maybeSingle()
        : await db.from("projects").insert(project).select().maybeSingle();
      if (error) throw new Error(error.message);
      return data as Project;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

// ─── Mutation: toggle project active state ─────────────────────────────────
export function useToggleProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await db.from("projects").update({ is_active }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}
