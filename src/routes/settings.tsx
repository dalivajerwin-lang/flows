import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/stores/auth-store";
import { useSettings, type Theme } from "@/stores/settings-store";
import { useSystemSettings, useUpdateSystemSettings } from "@/hooks/use-registration-tokens";
import { Button } from "@/components/ui/tenacious-button";
import { Field, TenaciousInput } from "@/components/ui/form-controls";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { RouteErrorBoundary, RouteNotFoundBoundary } from "@/lib/route-boundaries";
import { requireAuth } from "@/lib/route-guards";
import { ShieldAlert, KeyRound, Settings, Save, Sun, Moon, Monitor } from "lucide-react";

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

  const {
    data: settings,
    isLoading: isLoadingSettings,
    refetch: refetchSettings,
  } = useSystemSettings();
  const updateSettingsMutation = useUpdateSystemSettings();

  // Tab state
  const [activeTab, setActiveTab] = useState("account");

  // Account form state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Settings</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Manage your account password and system rules.
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
        <TabsContent value="account" className="mt-0 space-y-6">
          <div className="max-w-[480px] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-1">Appearance</h2>
            <p className="text-xs text-[var(--color-text-secondary)] mb-6">
              Choose how Tenacious looks on this device.
            </p>
            <ThemeSelector />
          </div>

          <div className="max-w-[480px] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-sm">
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

        {/* --- System Tab --- */}
        {isSuperadmin && (
          <TabsContent value="system" className="mt-0">
            <div className="max-w-[540px] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-sm space-y-6">
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
                  <div className="flex items-start justify-between rounded-[var(--radius-md)] border border-[var(--color-danger-soft-border)] bg-[var(--color-danger-soft-bg)] p-4 gap-4">
                    <div className="space-y-1">
                      <div className="font-semibold text-[var(--color-danger-soft-fg)] flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-[var(--color-error)]" />
                        Lock User Registration
                      </div>
                      <p className="text-xs text-[var(--color-danger-soft-fg)] leading-relaxed">
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
    </div>
  );
}

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

function ThemeSelector() {
  const theme = useSettings((s) => s.theme);
  const setTheme = useSettings((s) => s.setTheme);
  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="grid grid-cols-3 gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-1"
    >
      {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className={`flex items-center justify-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-tenacious ${
              active
                ? "bg-[var(--color-background)] text-[var(--color-text)] shadow-[var(--shadow-sm)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
