// supabase/functions/admin-user-ops/index.ts
// Superadmin-only user operations that require the service role:
//   - revoke_sessions: sign a user out everywhere (e.g. after deactivation)
//   - send_reset:      send a password-recovery email
//   - delete_user:     hard-delete an auth user + profile (unused accounts only)
// The caller's JWT must resolve to the active superadmin profile; every
// action writes an audit_trail row.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Authorize: caller must be the active superadmin.
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "Not authorized." }, 401);
    const { data: callerData, error: callerError } = await adminClient.auth.getUser(jwt);
    if (callerError || !callerData?.user) return json({ error: "Not authorized." }, 401);

    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("role, is_active")
      .eq("id", callerData.user.id)
      .maybeSingle();
    if (!callerProfile?.is_active || callerProfile.role !== "superadmin") {
      return json({ error: "Not authorized." }, 403);
    }

    const { action, target_id } = await req.json();
    if (typeof action !== "string" || typeof target_id !== "string") {
      return json({ error: "Missing action or target_id" }, 400);
    }
    if (target_id === callerData.user.id) {
      return json({ error: "You cannot target your own account." }, 400);
    }

    const { data: target } = await adminClient
      .from("profiles")
      .select("id, display_name, email, role")
      .eq("id", target_id)
      .maybeSingle();
    if (!target) return json({ error: "User not found." }, 404);
    if (target.role === "superadmin") {
      return json({ error: "The superadmin account cannot be targeted." }, 400);
    }

    const audit = (type: string, summary: string, severity = "warning") =>
      adminClient
        .from("audit_trail")
        .insert({
          actor_id: callerData.user.id,
          type,
          summary,
          meta: { target_id, action },
          severity,
        })
        .then(
          () => undefined,
          () => undefined,
        );

    switch (action) {
      case "revoke_sessions": {
        const { error } = await adminClient.auth.admin.signOut(target_id, "global");
        if (error) return json({ error: error.message }, 400);
        await audit("user.sessions_revoked", `All sessions revoked for ${target.display_name}`);
        return json({ message: "Sessions revoked." }, 200);
      }
      case "send_reset": {
        const { error } = await adminClient.auth.resetPasswordForEmail(target.email);
        if (error) return json({ error: error.message }, 400);
        await audit("user.password_reset_sent", `Password reset email sent to ${target.display_name}`, "info");
        return json({ message: "Password reset email sent." }, 200);
      }
      case "delete_user": {
        // Hard delete is only for accounts that never touched the pipeline;
        // otherwise history would dangle. Deactivate + reassign instead.
        const { count: leadCount } = await adminClient
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("assigned_to", target_id);
        if ((leadCount ?? 0) > 0) {
          return json(
            { error: "User has assigned leads. Deactivate the account and reassign their leads instead." },
            409,
          );
        }
        // Audit first: the profile row (and its FK'd audit rows) go away
        // with the auth user, so this row must not reference the target.
        await audit("user.deleted", `User ${target.display_name} (${target.email}) permanently deleted`, "critical");
        const { error } = await adminClient.auth.admin.deleteUser(target_id);
        if (error) return json({ error: error.message }, 400);
        return json({ message: "User deleted." }, 200);
      }
      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return json({ error: message }, 500);
  }
});
