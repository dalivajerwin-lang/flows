import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/tenacious-button";
import { Field, TenaciousInput } from "@/components/ui/form-controls";
import { db, supabase } from "@/lib/supabase";
import { RouteErrorBoundary, RouteNotFoundBoundary } from "@/lib/route-boundaries";
import { ShieldCheck, Loader2 } from "lucide-react";

export const Route = createFileRoute("/setup")({
  head: () => ({ meta: [{ title: "System Setup — Tenacious CRM" }] }),
  component: SetupPage,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: RouteNotFoundBoundary,
});

function SetupPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [alreadySetup, setAlreadySetup] = useState(false);

  // Check whether any profiles already exist — if yes, redirect to /login
  useEffect(() => {
    async function check() {
      const { count } = await db.from("profiles").select("id", { count: "exact", head: true });
      if ((count ?? 0) > 0) {
        setAlreadySetup(true);
        navigate({ to: "/login" });
      }
      setChecking(false);
    }
    check();
  }, [navigate]);

  const [displayName, setDisplayName] = useState("");
  const [agentNumber, setAgentNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!displayName.trim()) {
      setSubmitError("Display name is required.");
      return;
    }
    if (!agentNumber.trim()) {
      setSubmitError("Agent number is required.");
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setSubmitError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create the auth user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (signUpError) throw new Error(signUpError.message);
      const userId = signUpData.user?.id;
      if (!userId) throw new Error("Failed to create user account.");

      // 2. Create the superadmin profile
      const { error: profileError } = await db.from("profiles").insert({
        id: userId,
        display_name: displayName.trim(),
        agent_number: agentNumber.trim(),
        role: "superadmin",
        is_active: true,
      });
      if (profileError) throw new Error(profileError.message);

      // 3. Sign in immediately
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw new Error(signInError.message);

      toast.success("Superadmin account created! Welcome to Tenacious CRM.");
      navigate({ to: "/" });
    } catch (err: any) {
      setSubmitError(err.message || "Setup failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checking || alreadySetup) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px]">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="text-4xl font-extrabold tracking-tight text-[var(--color-text)]">
            Tenacious
          </div>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            First-time setup — create your Superadmin account.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-sm)]"
        >
          {/* Badge */}
          <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary-light)] px-3 py-2 text-xs font-semibold text-[var(--color-primary-hover)] mb-5">
            <ShieldCheck size={14} />
            Superadmin — full system access
          </div>

          <h2 className="text-xl font-semibold text-[var(--color-text)]">Bootstrap Setup</h2>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            This page is only shown once, before any users are registered.
          </p>

          <div className="mt-5 space-y-4">
            <Field label="Display Name" htmlFor="displayName" required>
              <TenaciousInput
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Ky Santos"
                required
                disabled={isSubmitting}
                autoFocus
              />
            </Field>

            <Field label="Agent Number" htmlFor="agentNumber" required>
              <TenaciousInput
                id="agentNumber"
                type="text"
                value={agentNumber}
                onChange={(e) => setAgentNumber(e.target.value)}
                placeholder="e.g. 0001"
                required
                disabled={isSubmitting}
              />
            </Field>

            <Field label="Email Address" htmlFor="email" required>
              <TenaciousInput
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="superadmin@team.com"
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

            {submitError && (
              <p className="rounded-[var(--radius-sm)] bg-red-50 px-3 py-2 text-sm text-[var(--color-error)]">
                {submitError}
              </p>
            )}

            <Button type="submit" fullWidth disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Creating account...
                </>
              ) : (
                "Create Superadmin Account"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
