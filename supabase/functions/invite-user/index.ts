// supabase/functions/invite-user/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing environment variables SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { email, role, display_name, agent_number, password, token } = await req.json();

    let finalRole = role;
    let finalDisplayName = display_name;
    let finalAgentNumber = agent_number;

    // 1. Authorize the request. Two allowed paths:
    //    a) A valid single-use registration token (role comes from the token).
    //    b) No token: the caller's JWT must resolve to an active
    //       manager/superadmin profile (direct admin invite).
    if (token) {
      const { data: tokenData, error: tokenError } = await adminClient
        .from("registration_tokens")
        .select("*")
        .eq("token", token)
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (tokenError || !tokenData) {
        return new Response(JSON.stringify({ error: "Invalid or expired registration token." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      finalRole = tokenData.intended_role;
      finalDisplayName = tokenData.intended_display_name;
      finalAgentNumber = tokenData.intended_agent_number;
    } else {
      const authHeader = req.headers.get("Authorization") ?? "";
      const jwt = authHeader.replace(/^Bearer\s+/i, "");
      if (!jwt) {
        return new Response(JSON.stringify({ error: "Not authorized." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: callerData, error: callerError } = await adminClient.auth.getUser(jwt);
      if (callerError || !callerData?.user) {
        return new Response(JSON.stringify({ error: "Not authorized." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: callerProfile } = await adminClient
        .from("profiles")
        .select("role, is_active")
        .eq("id", callerData.user.id)
        .maybeSingle();

      if (
        !callerProfile ||
        !callerProfile.is_active ||
        !["manager", "superadmin"].includes(callerProfile.role)
      ) {
        return new Response(JSON.stringify({ error: "Not authorized." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Direct invites can never mint a superadmin.
      if (!["manager", "property_consultant"].includes(finalRole)) {
        return new Response(JSON.stringify({ error: "Invalid role." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (!email || !finalRole || !finalDisplayName || !finalAgentNumber) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if registration is locked in system settings (unless creating via direct admin bypass, or enforce settings globally)
    const { data: settings } = await adminClient
      .from("system_settings")
      .select("registration_locked")
      .eq("id", 1)
      .maybeSingle();

    if (settings?.registration_locked) {
      return new Response(
        JSON.stringify({ error: "New registrations are currently locked by the administrator." }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 2. Create the user in Auth
    const { data: userData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      email_confirm: true,
      password: password || crypto.randomUUID().substring(0, 16), // Set custom password or auto-generate
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = userData.user;

    // 3. Insert profile record mapped to the user ID
    const { error: profileError } = await adminClient.from("profiles").insert({
      id: user.id,
      role: finalRole,
      display_name: finalDisplayName,
      agent_number: finalAgentNumber,
      email,
      is_active: true,
    });

    if (profileError) {
      // Clean up created auth user if profile insert failed to prevent orphaned users
      await adminClient.auth.admin.deleteUser(user.id);
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Consume the registration token if used
    if (token) {
      await adminClient.rpc("consume_registration_token", {
        p_token: token,
        p_used_by: user.id,
      });
    }

    return new Response(JSON.stringify({ id: user.id, message: "User created successfully" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
