import { create } from "zustand";
import { supabase, db } from "@/lib/supabase";
import { queryClient } from "@/lib/query-client";
import { useAssistantStore } from "./assistant-store";
import type { Database } from "@/types/supabase";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Purge all user-specific client state. Called on every sign-out (explicit
 * logout AND the SIGNED_OUT auth event, e.g. session expiry) so no CRM data
 * or chat history survives on a shared computer.
 */
function clearUserData() {
  // In-memory CRM data (leads, notes, profiles, reports...).
  queryClient.clear();
  // Assistant chat history & personal todos are persisted per-user in
  // localStorage — wipe both the live state and the persisted copy.
  useAssistantStore.setState({ messages: {}, todos: {} });
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem("tenacious:assistant");
    } catch {
      /* ignore */
    }
  }
}

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
    const identifier = agentNumberOrEmail.trim();
    let authUserId: string | null = null;

    if (identifier.includes("@")) {
      // Email login: straight password sign-in.
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: identifier,
        password,
      });
      if (authError) {
        return { ok: false, error: authError.message };
      }
      authUserId = authData.user.id;
    } else {
      // Agent-number login: resolved server-side by the agent-login Edge
      // Function (rate-limited; never exposes the email), which returns
      // session tokens we adopt locally.
      const { data, error } = await supabase.functions.invoke<{
        access_token?: string;
        refresh_token?: string;
        error?: string;
      }>("agent-login", {
        body: { agent_number: identifier, password },
      });

      if (error || data?.error || !data?.access_token || !data?.refresh_token) {
        return { ok: false, error: data?.error || "Invalid agent number or password." };
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      if (sessionError || !sessionData.user) {
        return { ok: false, error: "Invalid agent number or password." };
      }
      authUserId = sessionData.user.id;
    }

    // Update last login timestamp in public profiles.
    const { data: profile } = await db
      .from("profiles")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", authUserId)
      .select()
      .maybeSingle();
    const typedProfile = profile as Profile | null;

    if (!typedProfile) {
      return { ok: false, error: "Profile record not found." };
    }

    set({ userId: authUserId, profile: typedProfile, rememberMe: remember });
    return { ok: true, profile: typedProfile };
  },

  logout: async () => {
    const { rememberMe } = get();
    // When rememberMe is false, clear only the local session (no server-side
    // revocation). When true (default), use a full global sign-out.
    await supabase.auth.signOut(rememberMe ? undefined : { scope: "local" });
    clearUserData();
    set({ userId: null, profile: null, rememberMe: false });
  },
}));

/** Registers the auth state change listener exactly once per app session. */
function _setupListener(set: (partial: Partial<AuthState>) => void, get: () => AuthState) {
  if (_authListenerReady) return;
  _authListenerReady = true;

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_OUT") {
      clearUserData();
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
