import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/stores/auth-store";
import { useAllProfiles, useUpdateProfile } from "@/hooks/use-profiles";
import { useRegistrationTokens, useCreateRegistrationToken } from "@/hooks/use-registration-tokens";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RouteErrorBoundary, RouteNotFoundBoundary } from "@/lib/route-boundaries";
import {
  Copy,
  Plus,
  Search,
  ShieldAlert,
  Check,
  RefreshCw,
  UserCheck,
  UserX,
  Link,
} from "lucide-react";

export const Route = createFileRoute("/team")({
  head: () => ({ meta: [{ title: "Team Management — Tenacious CRM" }] }),
  component: TeamPage,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: RouteNotFoundBoundary,
});

function TeamPage() {
  const currentProfile = useAuth((s) => s.profile);
  const {
    data: profiles = [],
    isLoading: isLoadingProfiles,
    refetch: refetchProfiles,
  } = useAllProfiles();
  const {
    data: tokens = [],
    isLoading: isLoadingTokens,
    refetch: refetchTokens,
  } = useRegistrationTokens();
  const updateProfileMutation = useUpdateProfile();
  const createTokenMutation = useCreateRegistrationToken();

  const [activeTab, setActiveTab] = useState("roster");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Invite Form State
  const [inviteName, setInviteName] = useState("");
  const [inviteAgentNumber, setInviteAgentNumber] = useState("");
  const [inviteRole, setInviteRole] = useState<"manager" | "property_consultant">(
    "property_consultant",
  );
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProfile) return;

    try {
      const result = await createTokenMutation.mutateAsync({
        intended_display_name: inviteName.trim(),
        intended_agent_number: inviteAgentNumber.trim(),
        intended_role: inviteRole,
        created_by: currentProfile.id,
      });

      const origin = window.location.origin;
      const link = `${origin}/register?token=${result.token}`;
      setGeneratedLink(link);
      toast.success("Registration token generated successfully!");
      refetchTokens();
    } catch (err: any) {
      toast.error(err.message || "Failed to generate invite token.");
    }
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    toast.success("Registration link copied to clipboard!");
  };

  const resetInviteForm = () => {
    setInviteName("");
    setInviteAgentNumber("");
    setInviteRole("property_consultant");
    setGeneratedLink(null);
  };

  const handleToggleActive = async (profileId: string, currentActive: boolean) => {
    if (profileId === currentProfile?.id) {
      toast.error("You cannot deactivate your own account.");
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        id: profileId,
        patch: { is_active: !currentActive },
      });
      toast.success(`Account ${!currentActive ? "activated" : "deactivated"} successfully.`);
      refetchProfiles();
    } catch (err: any) {
      toast.error(err.message || "Failed to update user status.");
    }
  };

  // Filters
  const filteredProfiles = profiles.filter((p) => {
    if (p.role === "superadmin") return false; // Exclude superadmins from team list
    const matchesSearch =
      p.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.agent_number.includes(searchQuery) ||
      (p.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
            Team Management
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Manage your consultant roster and register new team members.
          </p>
        </div>
        <Button
          onClick={() => {
            resetInviteForm();
            setIsInviteOpen(true);
          }}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Invite Consultant
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="roster">Roster ({filteredProfiles.length})</TabsTrigger>
          <TabsTrigger value="invites">
            Pending Invites ({tokens.filter((t) => !t.used_at).length})
          </TabsTrigger>
        </TabsList>

        {/* --- Roster Tab --- */}
        <TabsContent value="roster" className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-secondary)]" />
              <TenaciousInput
                placeholder="Search name, agent number, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            >
              <option value="all">All Roles</option>
              <option value="manager">Managers</option>
              <option value="property_consultant">Consultants</option>
            </select>
          </div>

          {isLoadingProfiles ? (
            <div className="py-12 text-center text-sm text-[var(--color-text-secondary)]">
              Loading team roster...
            </div>
          ) : (
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Consultant</TableHead>
                    <TableHead>Agent #</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Access Control</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-24 text-center text-sm text-[var(--color-text-secondary)]"
                      >
                        No team members match your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProfiles.map((p) => (
                      <TableRow
                        key={p.id}
                        className={!p.is_active ? "opacity-60 bg-gray-50/50" : ""}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center font-bold text-[var(--color-primary)] overflow-hidden">
                              {p.profile_photo_url ? (
                                <img
                                  src={p.profile_photo_url}
                                  alt={p.display_name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                p.display_name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-[var(--color-text)]">
                                {p.display_name}
                              </div>
                              <div className="text-xs text-[var(--color-text-secondary)]">
                                {p.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm font-semibold">
                          {p.agent_number}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {p.role.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              p.is_active
                                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                : "bg-red-500 hover:bg-red-600 text-white"
                            }
                          >
                            {p.is_active ? "Active" : "Deactivated"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-[var(--color-text-secondary)]">
                          {p.last_login_at ? new Date(p.last_login_at).toLocaleString() : "Never"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-3 justify-end">
                            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                              {p.is_active ? "Active" : "Locked"}
                            </span>
                            <Switch
                              checked={p.is_active}
                              onCheckedChange={() => handleToggleActive(p.id, p.is_active)}
                              disabled={p.id === currentProfile?.id}
                            />
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

        {/* --- Pending Invites Tab --- */}
        <TabsContent value="invites" className="mt-4">
          {isLoadingTokens ? (
            <div className="py-12 text-center text-sm text-[var(--color-text-secondary)]">
              Loading active tokens...
            </div>
          ) : (
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Target Nominee</TableHead>
                    <TableHead>Agent #</TableHead>
                    <TableHead>Intended Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokens.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-24 text-center text-sm text-[var(--color-text-secondary)]"
                      >
                        No invitations found. Use "Invite Consultant" to invite.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tokens.map((t) => {
                      const isExpired = new Date(t.expires_at) < new Date();
                      const isUsed = !!t.used_at;

                      let statusBadge = <Badge className="bg-amber-500 text-white">Pending</Badge>;
                      if (isUsed) {
                        statusBadge = (
                          <Badge className="bg-emerald-500 text-white">Registered</Badge>
                        );
                      } else if (isExpired) {
                        statusBadge = <Badge className="bg-gray-400 text-white">Expired</Badge>;
                      }

                      return (
                        <TableRow key={t.id}>
                          <TableCell className="font-semibold text-[var(--color-text)]">
                            {t.intended_display_name}
                          </TableCell>
                          <TableCell className="font-mono text-sm font-semibold">
                            {t.intended_agent_number}
                          </TableCell>
                          <TableCell className="capitalize">
                            {t.intended_role.replace("_", " ")}
                          </TableCell>
                          <TableCell>{statusBadge}</TableCell>
                          <TableCell className="text-sm text-[var(--color-text-secondary)]">
                            {new Date(t.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {!isUsed && !isExpired && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  const link = `${window.location.origin}/register?token=${t.token}`;
                                  navigator.clipboard.writeText(link);
                                  toast.success("Link copied!");
                                }}
                                className="flex items-center gap-1.5 ml-auto"
                              >
                                <Copy className="h-3.5 w-3.5" />
                                Copy Link
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* --- Invite Consultant Modal --- */}
      <Dialog
        open={isInviteOpen}
        onOpenChange={(open) => {
          if (!open) setIsInviteOpen(false);
        }}
      >
        <DialogContent className="max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Invite New Consultant</DialogTitle>
            <DialogDescription>
              Generate a unique signup link. The recipient will use this link to create their
              password and email setup.
            </DialogDescription>
          </DialogHeader>

          {generatedLink ? (
            <div className="space-y-4 py-4">
              <div className="rounded-[var(--radius-md)] bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-sm">
                <div className="font-semibold mb-1">Invitation Link Ready!</div>
                Share this link with {inviteName}. It will expire in 7 days and can only be used
                once.
              </div>

              <div className="flex gap-2">
                <TenaciousInput
                  readOnly
                  value={generatedLink}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="flex-1 font-mono text-xs"
                />
                <Button onClick={handleCopyLink} className="flex items-center gap-2">
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>

              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setIsInviteOpen(false);
                  resetInviteForm();
                }}
                className="mt-2"
              >
                Close Panel
              </Button>
            </div>
          ) : (
            <form onSubmit={handleInviteSubmit} className="space-y-4 py-4">
              <Field label="Display Name" htmlFor="inviteName" required>
                <TenaciousInput
                  id="inviteName"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                />
              </Field>

              <Field label="Agent Number" htmlFor="inviteAgent" required>
                <TenaciousInput
                  id="inviteAgent"
                  value={inviteAgentNumber}
                  onChange={(e) => setInviteAgentNumber(e.target.value)}
                  placeholder="e.g. 2004"
                  required
                />
              </Field>

              <Field label="System Role" htmlFor="inviteRole" required>
                <select
                  id="inviteRole"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full h-10 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                >
                  <option value="property_consultant">Property Consultant</option>
                  <option value="manager">Manager</option>
                </select>
              </Field>

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="secondary" onClick={() => setIsInviteOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTokenMutation.isPending}>
                  {createTokenMutation.isPending ? "Generating..." : "Generate Token"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
