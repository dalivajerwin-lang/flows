import { create } from "zustand";
import { supabase, db } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthState {
  userId: string | null;
  profile: Profile | null;
  rememberMe: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  login: (
    agentNumberOrEmail: string,
    password: string,
    remember: boolean,
  ) => Promise<{ ok: true; profile: Profile } | { ok: false; error: string }>;
  logout: () => Promise<void>;
}

/**
 * Module-level flag: ensures onAuthStateChange is registered at most once
 * across the entire app lifetime, even if hydrate() is called multiple times.
 */
let _authListenerReady = false;

export const useAuth = create<AuthState>((set, get) => ({
  userId: null,
  profile: null,
  rememberMe: false,
  hydrated: false,

  hydrate: async () => {
    // Already hydrated — skip the DB fetch but still ensure the listener is set up.
    if (get().hydrated) {
      if (!_authListenerReady) _setupListener(set, get);
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id ?? null;
      let profile: Profile | null = null;
      if (userId) {
        const { data } = await db.from("profiles").select("*").eq("id", userId).maybeSingle();
        profile = (data as Profile) ?? null;
      }
      set({ userId, profile, hydrated: true });
    } catch {
      set({ hydrated: true });
    }

    _setupListener(set, get);
  },

  login: async (agentNumberOrEmail, password, remember) => {
    let email = agentNumberOrEmail.trim();

    // If it looks like an agent number (no @), resolve it to an email address.
    if (!email.includes("@")) {
      const { data, error } = await db.rpc("resolve_agent_login_email", {
        p_agent_number: email,
      });

      if (error || !data) {
        return { ok: false, error: "Invalid agent number or password." };
      }
      email = data as string;
    }

    // Perform Supabase email/password login.
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return { ok: false, error: authError.message };
    }

    // Update last login timestamp in public profiles.
    const { data: profile } = await db
      .from("profiles")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", authData.user.id)
      .select()
      .maybeSingle();
    const typedProfile = profile as Profile | null;

    if (!typedProfile) {
      return { ok: false, error: "Profile record not found." };
    }

    set({ userId: authData.user.id, profile: typedProfile, rememberMe: remember });
    return { ok: true, profile: typedProfile };
  },

  logout: async () => {
    const { rememberMe } = get();
    // When rememberMe is false, clear only the local session (no server-side
    // revocation). When true (default), use a full global sign-out.
    await supabase.auth.signOut(rememberMe ? undefined : { scope: "local" });
    set({ userId: null, profile: null, rememberMe: false });
  },
}));

/** Registers the auth state change listener exactly once per app session. */
function _setupListener(set: (partial: Partial<AuthState>) => void, get: () => AuthState) {
  if (_authListenerReady) return;
  _authListenerReady = true;

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_OUT") {
      set({ userId: null, profile: null });
      return;
    }

    const userId = session?.user?.id ?? null;
    let profile: Profile | null = null;

    if (userId) {
      const { data } = await db.from("profiles").select("*").eq("id", userId).maybeSingle();
      profile = (data as Profile) ?? null;
    }

    set({ userId, profile });
  });
}

export function useCurrentProfile(): Profile | null {
  return useAuth((s) => s.profile);
}
