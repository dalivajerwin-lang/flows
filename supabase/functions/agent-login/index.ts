// supabase/functions/agent-login/index.ts
// Server-side agent-number login. Resolves the agent number to an email
// with the service role (the client can no longer do this — see migration
// 012), performs the password sign-in, and returns the session tokens.
// The email is never disclosed on failure, and a per-IP rate limit slows
// enumeration/brute-force attempts.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple sliding-window rate limit per client IP. Edge function instances
// are ephemeral, so this is best-effort — enough to blunt bulk enumeration.
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 10;
const attempts = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (attempts.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  attempts.set(ip, list);
  return list.length > MAX_ATTEMPTS;
}

const GENERIC_ERROR = "Invalid agent number or password.";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";
    if (rateLimited(ip)) {
      return json({ error: "Too many attempts. Try again in a minute." }, 429);
    }

    const { agent_number, password } = await req.json();
    if (typeof agent_number !== "string" || typeof password !== "string" || !password) {
      return json({ error: GENERIC_ERROR }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Resolve agent number → email server-side only.
    const { data: profile } = await adminClient
      .from("profiles")
      .select("email")
      .eq("agent_number", agent_number.trim())
      .eq("is_active", true)
      .maybeSingle();

    if (!profile?.email) {
      // Same error and status as a wrong password — no enumeration signal.
      return json({ error: GENERIC_ERROR }, 401);
    }

    // Sign in with the anon client so the returned session is a normal
    // user session (not service-role).
    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email: profile.email,
      password,
    });

    if (authError || !authData.session) {
      return json({ error: GENERIC_ERROR }, 401);
    }

    return json(
      {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
      },
      200,
    );
  } catch {
    return json({ error: GENERIC_ERROR }, 500);
  }
});
