import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/stores/auth-store";
import { useSystemSettings, useUpdateSystemSettings } from "@/hooks/use-registration-tokens";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { RouteErrorBoundary, RouteNotFoundBoundary } from "@/lib/route-boundaries";
import { requireAuth } from "@/lib/route-guards";
import { ShieldAlert, KeyRound, Settings, Building, Plus, Pencil, Save, X } from "lucide-react";

export const Route = createFileRoute("/settings")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "Settings — Tenacious CRM" }] }),
  component: SettingsPage,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: RouteNotFoundBoundary,
});

function SettingsPage() {
  const currentProfile = useAuth((s) => s.profile);
  const isSuperadmin = currentProfile?.role === "superadmin";
  const isManagerOrAdmin = currentProfile?.role === "manager" || isSuperadmin;

  const {
    data: settings,
    isLoading: isLoadingSettings,
    refetch: refetchSettings,
  } = useSystemSettings();
  const {
    data: projects = [],
    isLoading: isLoadingProjects,
    refetch: refetchProjects,
  } = useAllProjects();
  const updateSettingsMutation = useUpdateSystemSettings();
  const upsertProjectMutation = useUpsertProject();
  const toggleProjectMutation = useToggleProject();

  // Tab state
  const [activeTab, setActiveTab] = useState("account");

  // Account form state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Project form state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectDeveloper, setProjectDeveloper] = useState("DMCI Homes");
  const [projectSortOrder, setProjectSortOrder] = useState(0);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleToggleRegistrationLock = async (checked: boolean) => {
    try {
      await updateSettingsMutation.mutateAsync({ registration_locked: checked });
      toast.success(`User registration is now ${checked ? "LOCKED" : "UNLOCKED"}.`);
      refetchSettings();
    } catch (err: any) {
      toast.error(err.message || "Failed to update system settings.");
    }
  };

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Settings</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Manage your account password, system rules, and developers/projects roster.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0 border-b border-[var(--color-border)] mb-4">
          <TabsTrigger
            value="account"
            className="flex items-center gap-2 border-b-2 border-transparent data-[state=active]:border-[var(--color-primary)] data-[state=active]:bg-transparent rounded-none px-4 py-2 text-sm font-medium"
          >
            <KeyRound className="h-4 w-4" />
            My Account
          </TabsTrigger>

          {isManagerOrAdmin && (
            <TabsTrigger
              value="projects"
              className="flex items-center gap-2 border-b-2 border-transparent data-[state=active]:border-[var(--color-primary)] data-[state=active]:bg-transparent rounded-none px-4 py-2 text-sm font-medium"
            >
              <Building className="h-4 w-4" />
              Projects List
            </TabsTrigger>
          )}

          {isSuperadmin && (
            <TabsTrigger
              value="system"
              className="flex items-center gap-2 border-b-2 border-transparent data-[state=active]:border-[var(--color-primary)] data-[state=active]:bg-transparent rounded-none px-4 py-2 text-sm font-medium"
            >
              <Settings className="h-4 w-4" />
              System Settings
            </TabsTrigger>
          )}
        </TabsList>

        {/* --- My Account Tab --- */}
        <TabsContent value="account" className="mt-0">
          <div className="max-w-[480px] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-1">Update Password</h2>
            <p className="text-xs text-[var(--color-text-secondary)] mb-6">
              Change the password you use to log in to your Tenacious account.
            </p>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <Field label="New Password" htmlFor="newPass" required>
                <TenaciousInput
                  id="newPass"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  disabled={isUpdatingPassword}
                  autoComplete="new-password"
                />
              </Field>

              <Field label="Confirm New Password" htmlFor="confirmPass" required>
                <TenaciousInput
                  id="confirmPass"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Verify your new password"
                  required
                  disabled={isUpdatingPassword}
                  autoComplete="new-password"
                />
              </Field>

              <Button
                type="submit"
                disabled={isUpdatingPassword}
                className="mt-2 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isUpdatingPassword ? "Updating..." : "Save Password"}
              </Button>
            </form>
          </div>
        </TabsContent>

        {/* --- Projects Tab --- */}
        {isManagerOrAdmin && (
          <TabsContent value="projects" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text)]">System Projects</h2>
                <p className="text-xs text-[var(--color-text-secondary)]">
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
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm overflow-hidden">
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
                          className={!proj.is_active ? "opacity-60 bg-gray-50/50" : ""}
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
          </TabsContent>
        )}

        {/* --- System Tab --- */}
        {isSuperadmin && (
          <TabsContent value="system" className="mt-0">
            <div className="max-w-[540px] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text)]">
                  Global Security Rules
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Superadmin-only registration overrides.
                </p>
              </div>

              {isLoadingSettings ? (
                <div className="py-4 text-sm text-[var(--color-text-secondary)]">
                  Loading system state...
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start justify-between rounded-[var(--radius-md)] border border-red-100 bg-red-50/50 p-4 gap-4">
                    <div className="space-y-1">
                      <div className="font-semibold text-red-950 flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-[var(--color-error)]" />
                        Lock User Registration
                      </div>
                      <p className="text-xs text-red-900 leading-relaxed">
                        When enabled, all registration tokens are immediately locked. New users will
                        be blocked from registering accounts, even if they have valid token links.
                      </p>
                    </div>
                    <div className="pt-1">
                      <Switch
                        checked={settings?.registration_locked ?? false}
                        onCheckedChange={handleToggleRegistrationLock}
                      />
                    </div>
                  </div>

                  <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-xs text-[var(--color-text-secondary)] space-y-1">
                    <div className="flex justify-between">
                      <span>Server Timezone:</span>
                      <span className="font-semibold text-[var(--color-text)]">
                        {settings?.company_timezone || "Asia/Manila"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Company ID Check:</span>
                      <span className="font-semibold text-[var(--color-text)]">
                        Active (Agent Number required)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>

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
