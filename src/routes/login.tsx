import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/stores/auth-store";
import { Button } from "@/components/ui/tenacious-button";
import { Field, TenaciousInput } from "@/components/ui/form-controls";
import { DownloadAppButton } from "@/components/pwa/download-app-button";
import { RouteErrorBoundary, RouteNotFoundBoundary } from "@/lib/route-boundaries";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Tenacious CRM" }] }),
  component: LoginPage,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: RouteNotFoundBoundary,
});

function LoginPage() {
  const navigate = useNavigate();
  const login = useAuth((s) => s.login);
  const userId = useAuth((s) => s.userId);
  const [emailOrAgent, setEmailOrAgent] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userId) navigate({ to: "/" });
  }, [userId, navigate]);

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
      toast.success(`Welcome back, ${result.profile.display_name.split(" ")[0]}!`);
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <div className="text-4xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-5xl">
            Tenacious
          </div>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Real-estate CRM for the Team Tenacious.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-sm)]"
        >
          <h2 className="text-xl font-semibold text-[var(--color-text)]">Sign in</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Sign in with your email address or agent number.
          </p>

          <div className="mt-6 space-y-4">
            <Field label="Email or Agent Number" htmlFor="identifier" required>
              <TenaciousInput
                id="identifier"
                type="text"
                value={emailOrAgent}
                onChange={(e) => setEmailOrAgent(e.target.value)}
                placeholder="e.g. name@teamtenacious.com or 2001"
                autoComplete="username"
                required
                hasError={!!error}
                disabled={isLoading}
              />
            </Field>
            <Field label="Password" htmlFor="password" required>
              <TenaciousInput
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                hasError={!!error}
                disabled={isLoading}
              />
            </Field>
            {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}

            <label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                disabled={isLoading}
                className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              Remember me for 30 days
            </label>

            <Button type="submit" fullWidth disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </div>
        </form>

        <DownloadAppButton />
      </div>
    </div>
  );
}
