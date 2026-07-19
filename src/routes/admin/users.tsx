import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/stores/auth-store";
import { useAllProfiles } from "@/hooks/use-profiles";
import { useRegistrationTokens } from "@/hooks/use-registration-tokens";
import { inviteUser } from "@/lib/invite-user";
import {
  useAdminSetRole,
  useAdminSetActive,
  useAdminRevokeToken,
  useAdminUserOp,
} from "@/hooks/use-admin";
import { Button } from "@/components/ui/tenacious-button";
import { Field, TenaciousInput } from "@/components/ui/form-controls";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  KeyRound,
  LogOut,
  MoreHorizontal,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserCog,
  UserPlus,
  UserX,
} from "lucide-react";
import type { Database } from "@/types/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "User Administration — Tenacious CRM" }] }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const me = useAuth((s) => s.profile);
  const { data: profiles = [], isLoading } = useAllProfiles();
  const { data: tokens = [] } = useRegistrationTokens();

  const setRole = useAdminSetRole();
  const setActive = useAdminSetActive();
  const revokeToken = useAdminRevokeToken();
  const userOp = useAdminUserOp();

  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  // Unlike /team, this list includes managers, inactive users, and shows
  // everything except the superadmin's own row actions.
  const filtered = useMemo(
    () =>
      profiles.filter((p) => {
        const q = search.toLowerCase();
        return (
          p.display_name.toLowerCase().includes(q) ||
          p.agent_number.includes(search) ||
          (p.email || "").toLowerCase().includes(q)
        );
      }),
    [profiles, search],
  );

  const pendingTokens = tokens.filter(
    (t) => !t.used_at && new Date(t.expires_at) > new Date(),
  );

  const run = async (fn: () => Promise<unknown>, success: string) => {
    try {
      await fn();
      toast.success(success);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await run(
      () => userOp.mutateAsync({ action: "delete_user", target_id: deleteTarget.id }),
      `${deleteTarget.display_name} permanently deleted.`,
    );
    setDeleteTarget(null);
    setDeleteConfirm("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[var(--color-text)]">
            <UserCog className="h-6 w-6 text-[var(--color-primary)]" />
            User Administration
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Full roster including managers and deactivated accounts. Every action here is audited.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4" />
          Create Account
        </Button>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="users">All Users ({profiles.length})</TabsTrigger>
          <TabsTrigger value="invites">Pending Invites ({pendingTokens.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-secondary)]" />
            <TenaciousInput
              placeholder="Search name, agent number, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-sm text-[var(--color-text-secondary)]">
              Loading users...
            </div>
          ) : (
            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Agent #</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => {
                    const isSelf = p.id === me?.id;
                    const isSuper = p.role === "superadmin";
                    return (
                      <TableRow key={p.id} className={!p.is_active ? "bg-[var(--color-surface-muted)]/50 opacity-60" : ""}>
                        <TableCell>
                          <div className="font-semibold text-[var(--color-text)]">
                            {p.display_name}
                            {isSelf && (
                              <span className="ml-2 text-xs font-normal text-[var(--color-text-secondary)]">
                                (you)
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[var(--color-text-secondary)]">{p.email}</div>
                        </TableCell>
                        <TableCell className="font-mono text-sm font-semibold">
                          {p.agent_number}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={isSuper ? "border-[var(--color-warning-soft-border-stronger)] bg-[var(--color-warning-soft-bg)] capitalize" : "capitalize"}
                          >
                            {isSuper && <ShieldCheck className="mr-1 h-3 w-3" />}
                            {p.role.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              p.is_active
                                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                : "bg-[var(--color-error)] text-white hover:brightness-95"
                            }
                          >
                            {p.is_active ? "Active" : "Deactivated"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-[var(--color-text-secondary)]">
                          {p.last_login_at ? new Date(p.last_login_at).toLocaleString() : "Never"}
                        </TableCell>
                        <TableCell className="text-right">
                          {!isSelf && !isSuper && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Role</DropdownMenuLabel>
                                <DropdownMenuItem
                                  disabled={p.role === "manager"}
                                  onClick={() =>
                                    run(
                                      () => setRole.mutateAsync({ targetId: p.id, newRole: "manager" }),
                                      `${p.display_name} is now a manager.`,
                                    )
                                  }
                                >
                                  <UserCog className="mr-2 h-4 w-4" /> Promote to manager
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={p.role === "property_consultant"}
                                  onClick={() =>
                                    run(
                                      () =>
                                        setRole.mutateAsync({
                                          targetId: p.id,
                                          newRole: "property_consultant",
                                        }),
                                      `${p.display_name} is now a consultant.`,
                                    )
                                  }
                                >
                                  <UserCheck className="mr-2 h-4 w-4" /> Demote to consultant
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Account</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() =>
                                    run(
                                      () =>
                                        setActive.mutateAsync({ targetId: p.id, active: !p.is_active }),
                                      p.is_active
                                        ? `${p.display_name} deactivated; sessions revoked.`
                                        : `${p.display_name} reactivated.`,
                                    )
                                  }
                                >
                                  {p.is_active ? (
                                    <>
                                      <UserX className="mr-2 h-4 w-4" /> Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="mr-2 h-4 w-4" /> Reactivate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    run(
                                      () =>
                                        userOp.mutateAsync({
                                          action: "revoke_sessions",
                                          target_id: p.id,
                                        }),
                                      `All sessions revoked for ${p.display_name}.`,
                                    )
                                  }
                                >
                                  <LogOut className="mr-2 h-4 w-4" /> Sign out everywhere
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    run(
                                      () =>
                                        userOp.mutateAsync({ action: "send_reset", target_id: p.id }),
                                      `Password reset email sent to ${p.display_name}.`,
                                    )
                                  }
                                >
                                  <KeyRound className="mr-2 h-4 w-4" /> Send password reset
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-[var(--color-danger-soft-fg)] focus:text-[var(--color-danger-soft-fg)]"
                                  onClick={() => setDeleteTarget(p)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete permanently...
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="invites" className="mt-4">
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Intended For</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTokens.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-sm text-[var(--color-text-secondary)]"
                    >
                      No pending invites.
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingTokens.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="font-semibold">{t.intended_display_name || "—"}</div>
                        <div className="text-xs text-[var(--color-text-secondary)]">
                          Agent #{t.intended_agent_number || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {(t.intended_role || "").replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-[var(--color-text-secondary)]">
                        {new Date(t.expires_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-[var(--color-danger-soft-fg)]"
                          onClick={() =>
                            run(() => revokeToken.mutateAsync(t.id), "Invite token revoked.")
                          }
                        >
                          Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <CreateAccountDialog open={createOpen} onOpenChange={setCreateOpen} />

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteConfirm("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.display_name} permanently?</DialogTitle>
            <DialogDescription>
              This removes the login and profile forever. It only works for accounts with no
              assigned leads — otherwise deactivate the account and reassign their pipeline
              instead. Type the agent number{" "}
              <span className="font-mono font-bold">{deleteTarget?.agent_number}</span> to confirm.
            </DialogDescription>
          </DialogHeader>
          <TenaciousInput
            placeholder="Agent number"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteTarget(null);
                setDeleteConfirm("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirm !== deleteTarget?.agent_number || userOp.isPending}
              onClick={confirmDelete}
            >
              Delete forever
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Direct account creation — no registration link. Calls the invite-user
 * edge function with an email + password; the account is usable
 * immediately. The function audits it as `user.invited`.
 */
function CreateAccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [agentNumber, setAgentNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"manager" | "property_consultant">("property_consultant");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName("");
    setAgentNumber("");
    setEmail("");
    setPassword("");
    setRole("property_consultant");
  };

  const close = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await inviteUser({
        email: email.trim(),
        role,
        display_name: name.trim(),
        agent_number: agentNumber.trim(),
        password,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `${name.trim()} created as ${role === "manager" ? "manager" : "consultant"}. They can log in right away.`,
      );
      qc.invalidateQueries({ queryKey: ["profiles"] });
      qc.invalidateQueries({ queryKey: ["audit_trail"] });
      close(false);
    } finally {
      setSubmitting(false);
    }
  };

  const valid =
    name.trim() && agentNumber.trim() && email.trim().includes("@") && password.length >= 8;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create account directly</DialogTitle>
          <DialogDescription>
            Creates a ready-to-use login — no registration link. Share the password with them
            privately; they can change it in Settings after first login.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Full name" required>
            <TenaciousInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Maria Santos"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Agent number" required>
              <TenaciousInput
                value={agentNumber}
                onChange={(e) => setAgentNumber(e.target.value)}
                placeholder="e.g. 2007"
              />
            </Field>
            <Field label="Role" required>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as typeof role)}
                className="h-10 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              >
                <option value="property_consultant">Property Consultant</option>
                <option value="manager">Manager</option>
              </select>
            </Field>
          </div>
          <Field label="Email" required>
            <TenaciousInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </Field>
          <Field label="Initial password" required helper="At least 8 characters.">
            <TenaciousInput
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="They can change this after logging in"
              autoComplete="off"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!valid || submitting}>
              {submitting ? "Creating..." : "Create account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
