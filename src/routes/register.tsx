import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/tenacious-button";
import { Field, TenaciousInput } from "@/components/ui/form-controls";
import { db, supabase } from "@/lib/supabase";
import { RouteErrorBoundary, RouteNotFoundBoundary } from "@/lib/route-boundaries";
import type { Database } from "@/types/supabase";

type RegistrationToken = Database["public"]["Tables"]["registration_tokens"]["Row"];

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Complete Registration - Tenacious CRM" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || "",
  }),
  component: RegisterPage,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: RouteNotFoundBoundary,
});

function RegisterPage() {
  const { token } = useSearch({ from: "/register" });
  const navigate = useNavigate();

  const [isValidating, setIsValidating] = useState(true);
  const [tokenData, setTokenData] = useState<RegistrationToken | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setValidationError(
          "A registration token is required to access this page. Please request an invite link from your team manager.",
        );
        setIsValidating(false);
        return;
      }

      try {
        const { data, error } = await db.rpc("validate_registration_token", {
          p_token: token,
        });

        if (error) throw new Error(error.message);

        const tokenRows = data as RegistrationToken[];
        if (!tokenRows || tokenRows.length === 0) {
          setValidationError(
            "This registration link is invalid, expired, or has already been used. Please contact your manager for a new invite link.",
          );
          setIsValidating(false);
          return;
        }

        setTokenData(tokenRows[0]);
      } catch (err) {
        setValidationError(err instanceof Error ? err.message : "Failed to validate invite token.");
      } finally {
        setIsValidating(false);
      }
    }

    validateToken();
  }, [token]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (password !== confirmPassword) {
      setSubmitError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setSubmitError("Password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke<{
        id?: string;
        message?: string;
        error?: string;
      }>("invite-user", {
        body: {
          email: email.trim(),
          password,
          token,
        },
      });

      if (error || data?.error || !data?.id) {
        throw new Error(error?.message || data?.error || "Registration service is unavailable.");
      }

      toast.success("Account created successfully! You can now log in.");
      navigate({ to: "/login" });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "An unexpected error occurred during registration.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center px-4 py-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
            Validating your invitation...
          </p>
        </div>
      </div>
    );
  }

  if (validationError) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-sm)] text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-[var(--color-error)] mb-4">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            Registration Link Invalid
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{validationError}</p>
          <Button onClick={() => navigate({ to: "/login" })} className="mt-6 w-full">
            Back to Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px]">
        <div className="mb-8 text-center">
          <div className="text-4xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-5xl">
            Tenacious
          </div>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Complete your consultant account registration.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-sm)]"
        >
          <h2 className="text-xl font-semibold text-[var(--color-text)]">Create Account</h2>

          {tokenData && (
            <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 text-xs border border-[var(--color-border)] space-y-1">
              <div className="flex justify-between">
                <span className="font-medium text-[var(--color-text-secondary)]">Name:</span>
                <span className="font-semibold text-[var(--color-text)]">
                  {tokenData.intended_display_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-[var(--color-text-secondary)]">
                  Agent Number:
                </span>
                <span className="font-semibold text-[var(--color-text)]">
                  {tokenData.intended_agent_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-[var(--color-text-secondary)]">Role:</span>
                <span className="font-semibold text-[var(--color-text)] capitalize">
                  {tokenData.intended_role.replace("_", " ")}
                </span>
              </div>
            </div>
          )}

          <div className="mt-6 space-y-4">
            <Field label="Email Address" htmlFor="email" required>
              <TenaciousInput
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. name@teamtenacious.com"
                required
                disabled={isSubmitting}
                autoComplete="email"
              />
            </Field>

            <Field label="Password" htmlFor="password" required>
              <TenaciousInput
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
                disabled={isSubmitting}
                autoComplete="new-password"
              />
            </Field>

            <Field label="Confirm Password" htmlFor="confirmPassword" required>
              <TenaciousInput
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Verify password"
                required
                disabled={isSubmitting}
                autoComplete="new-password"
              />
            </Field>

            {submitError && <p className="text-sm text-[var(--color-error)]">{submitError}</p>}

            <Button type="submit" fullWidth disabled={isSubmitting}>
              {isSubmitting ? "Setting up account..." : "Complete Registration"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
