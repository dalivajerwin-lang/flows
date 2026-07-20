import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, AlertCircle, Building2, TrendingUp, Users, MonitorSmartphone } from "lucide-react";
import { useAuth } from "@/stores/auth-store";
import { db } from "@/lib/supabase";
import { needsOnboarding } from "@/lib/onboarding-config";
import { Button } from "@/components/ui/tenacious-button";
import { Field, TenaciousInput } from "@/components/ui/form-controls";
import { RouteErrorBoundary, RouteNotFoundBoundary } from "@/lib/route-boundaries";
import { redirectIfAuthed } from "@/lib/route-guards";
import { usePwaInstall } from "@/lib/use-pwa-install";

export const Route = createFileRoute("/login")({
  beforeLoad: redirectIfAuthed,
  head: () => ({ meta: [{ title: "Sign in — Tenacious CRM" }] }),
  component: LoginPage,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: RouteNotFoundBoundary,
});

/** Rollout flag (§12.4): onboarding_enabled on system_settings. Fail open —
 * a fetch error must never block login. */
async function isOnboardingEnabled(): Promise<boolean> {
  try {
    const { data } = await db
      .from("system_settings")
      .select("onboarding_enabled")
      .eq("id", 1)
      .maybeSingle();
    return data?.onboarding_enabled !== false;
  } catch {
    return true;
  }
}

const BRAND_POINTS = [
  { icon: TrendingUp, text: "Track every lead from first contact to closed sale" },
  { icon: Users, text: "Team pipeline, goals, and leaderboards in one place" },
  { icon: Building2, text: "Built for Team Tenacious real-estate workflows" },
] as const;

function LoginPage() {
  const navigate = useNavigate();
  const login = useAuth((s) => s.login);
  const userId = useAuth((s) => s.userId);
  const [emailOrAgent, setEmailOrAgent] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Only for already-authed visits to /login. During an active submit the
    // onSubmit handler owns navigation (it may route to /onboarding instead).
    if (userId && !isLoading) navigate({ to: "/" });
  }, [userId, isLoading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const result = await login(emailOrAgent.trim(), password, remember);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // First-run onboarding (§2.1): only accounts that never started the
      // flow get redirected — an unfinished run resumes via the dashboard
      // banner instead of hijacking every login. Gated by the rollout flag
      // (§12.4). The superadmin never onboards — they administer the workspace.
      if (
        result.profile.role !== "superadmin" &&
        needsOnboarding((result.profile as { onboarding?: unknown }).onboarding)
      ) {
        const enabled = await isOnboardingEnabled();
        if (enabled) {
          navigate({ to: "/onboarding" });
          return;
        }
      }
      toast.success(`Welcome back, ${result.profile.display_name.split(" ")[0]}!`);
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-surface)] lg:flex-row">
      {/* ===== Mobile hero header (teal gradient, hidden on desktop) ===== */}
      <div className="relative overflow-hidden pb-20 pt-12 lg:hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(160deg,#047a7a_0%,#069494_60%,#05b0a4_100%)]"
        />
        <div
          aria-hidden
          className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-24 -left-12 h-48 w-48 rounded-full bg-black/10 blur-2xl"
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative z-10 px-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[var(--radius-lg)] bg-white/15 shadow-[var(--shadow-md)] backdrop-blur-sm">
            <Building2 className="h-8 w-8 text-white" aria-hidden />
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-white">Tenacious CRM</div>
          <p className="mt-1.5 text-sm text-white/80">Real-estate CRM for Team Tenacious</p>
        </div>
      </div>

      {/* ===== Brand panel (desktop only) ===== */}
      <div className="relative hidden w-[45%] max-w-[640px] overflow-hidden bg-[var(--color-primary-hover)] lg:flex lg:flex-col lg:justify-between">
        {/* Decorative layers */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(160deg,#047a7a_0%,#069494_55%,#05b0a4_100%)]"
        />
        <div
          aria-hidden
          className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-2xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-black/10 blur-2xl"
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-white/15 backdrop-blur-sm">
              <Building2 className="h-6 w-6 text-white" aria-hidden />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Tenacious CRM</span>
          </div>

          <div>
            <h1 className="max-w-md text-4xl font-extrabold leading-tight tracking-tight text-white">
              Close more deals.
              <br />
              Together.
            </h1>
            <ul className="mt-8 space-y-4">
              {BRAND_POINTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-white/90">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15">
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span className="text-sm leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} Team Tenacious. Internal use only.
          </p>
        </div>
      </div>

      {/* ===== Form panel ===== */}
      <div className="relative z-10 -mt-14 flex flex-1 items-start justify-center px-4 pb-10 lg:mt-0 lg:items-center lg:px-8 lg:py-10">
        <div className="w-full max-w-[400px]">
          <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-[var(--shadow-lg)] sm:p-8 lg:shadow-[var(--shadow-md)]">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
                Welcome back
              </h2>
              <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
                Sign in with your email address or agent number.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-danger-soft-border)] bg-[var(--color-danger-soft-bg)] px-3.5 py-3"
              >
                <AlertCircle
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-error)]"
                  aria-hidden
                />
                <p className="text-sm leading-snug text-[var(--color-danger-soft-fg)]">{error}</p>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <Field label="Email or Agent Number" htmlFor="identifier" required>
                <TenaciousInput
                  id="identifier"
                  type="text"
                  value={emailOrAgent}
                  onChange={(e) => setEmailOrAgent(e.target.value)}
                  placeholder="name@teamtenacious.com or 2001"
                  autoComplete="username"
                  autoFocus
                  required
                  hasError={!!error}
                  disabled={isLoading}
                />
              </Field>

              <Field label="Password" htmlFor="password" required>
                <div className="relative">
                  <TenaciousInput
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    hasError={!!error}
                    disabled={isLoading}
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4.5 w-4.5" aria-hidden />
                    ) : (
                      <Eye className="h-4.5 w-4.5" aria-hidden />
                    )}
                  </button>
                </div>
              </Field>

              <label className="flex cursor-pointer select-none items-center gap-2.5 py-1 text-sm text-[var(--color-text)]">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  disabled={isLoading}
                  className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] accent-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                />
                Remember me for 30 days
              </label>

              <Button type="submit" fullWidth disabled={isLoading} className="shadow-sm">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <p className="mt-5 text-center text-xs text-[var(--color-text-secondary)]">
              Trouble signing in? Contact your team manager.
            </p>
          </div>

          <InstallAppPrompt />

          {/* Mobile-only footer */}
          <p className="mt-6 text-center text-xs text-[var(--color-text-placeholder)] lg:hidden">
            © {new Date().getFullYear()} Team Tenacious
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * PWA install entry point beneath the login card. Always visible unless the
 * app is already installed (or running standalone).
 * - Chrome/Edge/Android with the native prompt ready: opens the install dialog.
 * - iOS: inline Share → Add to Home Screen instructions (Apple has no prompt).
 * - Prompt not (yet) available elsewhere: browser-menu instructions.
 */
function InstallAppPrompt() {
  const { installed, canInstall, showIosHint, promptInstall } = usePwaInstall();
  const [showHint, setShowHint] = useState(false);

  if (installed) return null;

  return (
    <div className="mt-4 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] shadow-[var(--shadow-sm)]">
      <button
        type="button"
        onClick={() => {
          if (canInstall) void promptInstall();
          else setShowHint((v) => !v);
        }}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-[var(--color-primary-light)]/40"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-light)]">
          <MonitorSmartphone className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-[var(--color-text)]">Install App</span>
          <span className="block text-xs text-[var(--color-text-secondary)]">
            Install app for faster access and experience.
          </span>
        </span>
      </button>
      {!canInstall && showHint && (
        <p className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-xs leading-relaxed text-[var(--color-text)]">
          {showIosHint ? (
            <>
              To install this app, tap <span className="font-semibold">Share</span> →{" "}
              <span className="font-semibold">Add to Home Screen</span>.
            </>
          ) : (
            <>
              To install this app, open your browser menu (<span className="font-semibold">⋮</span>)
              and choose <span className="font-semibold">Install app</span> or{" "}
              <span className="font-semibold">Add to Home screen</span>.
            </>
          )}
        </p>
      )}
    </div>
  );
}
