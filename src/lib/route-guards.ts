/**
 * Route guards for TanStack Router `beforeLoad`.
 *
 * These run before a route renders (and before its component code
 * executes on navigation), unlike the AppShell useEffect redirects
 * which only fire after hydration + render. The AppShell effects are
 * kept as a reactive fallback (e.g. session expiring mid-session);
 * these guards are the primary gate.
 *
 * On the server (SSR pass) the Supabase session lives in the browser's
 * localStorage and is not available, so guards no-op there — the client
 * router re-runs beforeLoad during hydration, and RLS protects all data
 * regardless.
 */
import { redirect } from "@tanstack/react-router";
import { supabase, db } from "@/lib/supabase";
import { useAuth, type Profile } from "@/stores/auth-store";

async function getSessionUserId(): Promise<string | null> {
  // Prefer the hydrated auth store: it is kept in sync by onAuthStateChange
  // (SIGNED_OUT clears it), and skipping getSession() here avoids taking the
  // supabase auth lock on every route transition.
  const cached = useAuth.getState();
  if (cached.hydrated) return cached.userId;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

async function getRole(userId: string): Promise<Profile["role"] | null> {
  // Prefer the hydrated auth store; fall back to a direct fetch when
  // beforeLoad runs before hydrate() completes (e.g. hard reload).
  const cached = useAuth.getState().profile;
  if (cached && cached.id === userId) return cached.role;
  const { data } = await db.from("profiles").select("role").eq("id", userId).maybeSingle();
  return (data?.role as Profile["role"]) ?? null;
}

/** Redirect to /login unless a Supabase session exists. */
export async function requireAuth() {
  if (typeof window === "undefined") return;
  const userId = await getSessionUserId();
  if (!userId) {
    throw redirect({ to: "/login" });
  }
}

/** Redirect to / unless the session user is a manager or superadmin. */
export async function requireManager() {
  if (typeof window === "undefined") return;
  const userId = await getSessionUserId();
  if (!userId) {
    throw redirect({ to: "/login" });
  }
  const role = await getRole(userId);
  if (role !== "manager" && role !== "superadmin") {
    throw redirect({ to: "/" });
  }
}

/** Redirect to / unless the session user is the superadmin. */
export async function requireSuperadmin() {
  if (typeof window === "undefined") return;
  const userId = await getSessionUserId();
  if (!userId) {
    throw redirect({ to: "/login" });
  }
  const role = await getRole(userId);
  if (role !== "superadmin") {
    throw redirect({ to: "/" });
  }
}

/** For /login: send already-authenticated users to the dashboard. */
export async function redirectIfAuthed() {
  if (typeof window === "undefined") return;
  const userId = await getSessionUserId();
  if (userId) {
    throw redirect({ to: "/" });
  }
}
