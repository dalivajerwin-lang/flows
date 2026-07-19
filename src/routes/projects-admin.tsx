import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useAllProjects, useUpsertProject, useToggleProject } from "@/hooks/use-projects";
import { Button } from "@/components/ui/tenacious-button";
import { Field, TenaciousInput } from "@/components/ui/form-controls";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { RouteErrorBoundary, RouteNotFoundBoundary } from "@/lib/route-boundaries";
import { requireManager } from "@/lib/route-guards";
import { Plus, Pencil } from "lucide-react";

export const Route = createFileRoute("/projects-admin")({
  beforeLoad: requireManager,
  head: () => ({ meta: [{ title: "Projects — Tenacious CRM" }] }),
  component: ProjectsAdminPage,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: RouteNotFoundBoundary,
});

/**
 * Dedicated project management page (manager/superadmin). Previously a tab
 * inside Settings — promoted to its own sidebar destination so the roster
 * is one tap away. Same data hooks: useAllProjects / upsert / toggle.
 */
function ProjectsAdminPage() {
  const {
    data: projects = [],
    isLoading: isLoadingProjects,
    refetch: refetchProjects,
  } = useAllProjects();
  const upsertProjectMutation = useUpsertProject();
  const toggleProjectMutation = useToggleProject();

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectDeveloper, setProjectDeveloper] = useState("DMCI Homes");
  const [projectSortOrder, setProjectSortOrder] = useState(0);

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: projectName.trim(),
        developer: projectDeveloper.trim(),
        sort_order: projectSortOrder,
      };
      if (editingProjectId) {
        payload.id = editingProjectId;
      }
      await upsertProjectMutation.mutateAsync(payload);
      toast.success(`Project ${editingProjectId ? "updated" : "created"} successfully!`);
      setIsProjectModalOpen(false);
      refetchProjects();
    } catch (err: any) {
      toast.error(err.message || "Failed to save project.");
    }
  };

  const handleEditProject = (proj: any) => {
    setEditingProjectId(proj.id);
    setProjectName(proj.name);
    setProjectDeveloper(proj.developer);
    setProjectSortOrder(proj.sort_order);
    setIsProjectModalOpen(true);
  };

  const handleOpenAddProject = () => {
    setEditingProjectId(null);
    setProjectName("");
    setProjectDeveloper("DMCI Homes");
    setProjectSortOrder(projects.length * 10);
    setIsProjectModalOpen(true);
  };

  const handleToggleProjectStatus = async (projId: string, currentActive: boolean) => {
    try {
      await toggleProjectMutation.mutateAsync({ id: projId, is_active: !currentActive });
      toast.success(`Project ${!currentActive ? "enabled" : "disabled"}.`);
      refetchProjects();
    } catch (err: any) {
      toast.error(err.message || "Failed to update project status.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Projects</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Configure the list of available properties for new lead requirements.
          </p>
        </div>
        <Button onClick={handleOpenAddProject} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Project
        </Button>
      </div>

      {isLoadingProjects ? (
        <div className="py-12 text-center text-sm text-[var(--color-text-secondary)]">
          Loading projects...
        </div>
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Developer</TableHead>
                <TableHead>Sort Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-sm text-[var(--color-text-secondary)]"
                  >
                    No projects configured in system database.
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((proj) => (
                  <TableRow
                    key={proj.id}
                    className={!proj.is_active ? "opacity-60 bg-[var(--color-surface-muted)]/50" : ""}
                  >
                    <TableCell className="font-semibold text-[var(--color-text)]">
                      {proj.name}
                    </TableCell>
                    <TableCell className="text-[var(--color-text-secondary)]">
                      {proj.developer}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{proj.sort_order}</TableCell>
                    <TableCell>
                      <Badge variant={proj.is_active ? "default" : "secondary"}>
                        {proj.is_active ? "Active" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-4 justify-end">
                        <button
                          onClick={() => handleEditProject(proj)}
                          className="text-[var(--color-primary)] hover:underline text-sm font-medium flex items-center gap-1"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--color-text-secondary)]">
                            {proj.is_active ? "Enabled" : "Disabled"}
                          </span>
                          <Switch
                            checked={proj.is_active}
                            onCheckedChange={() =>
                              handleToggleProjectStatus(proj.id, proj.is_active)
                            }
                          />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* --- Add/Edit Project Modal --- */}
      <Dialog
        open={isProjectModalOpen}
        onOpenChange={(open) => {
          if (!open) setIsProjectModalOpen(false);
        }}
      >
        <DialogContent className="max-w-[440px]">
          <DialogHeader>
            <DialogTitle>{editingProjectId ? "Edit Project" : "Add Project"}</DialogTitle>
            <DialogDescription>
              Configure project listings shown inside the Lead requirements form.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleProjectSubmit} className="space-y-4 py-4">
            <Field label="Project Name" htmlFor="projName" required>
              <TenaciousInput
                id="projName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. DMCI Birchwood"
                required
              />
            </Field>

            <Field label="Developer" htmlFor="projDev" required>
              <TenaciousInput
                id="projDev"
                value={projectDeveloper}
                onChange={(e) => setProjectDeveloper(e.target.value)}
                placeholder="e.g. DMCI Homes"
                required
              />
            </Field>

            <Field label="Sort Order" htmlFor="projSort" required>
              <TenaciousInput
                id="projSort"
                type="number"
                value={projectSortOrder}
                onChange={(e) => setProjectSortOrder(parseInt(e.target.value) || 0)}
                required
              />
            </Field>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsProjectModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={upsertProjectMutation.isPending}>
                {upsertProjectMutation.isPending ? "Saving..." : "Save Project"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
