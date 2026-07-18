import { supabase } from "@/lib/supabase";

export interface InviteUserPayload {
  /** Email address for the new user's auth account. */
  email: string;
  /** CRM role to assign in the profiles table. */
  role: "manager" | "property_consultant";
  /** Display name shown throughout the CRM. */
  display_name: string;
  /** Unique numeric agent number (e.g. "2003"). */
  agent_number: string;
  /**
   * Optional initial password. If omitted the Edge Function generates a
   * random one; the user should then set their own via Settings.
   */
  password?: string;
}

export interface InviteUserResult {
  ok: true;
  /** UUID of the newly created auth + profile record. */
  id: string;
  message: string;
}

export interface InviteUserError {
  ok: false;
  error: string;
}

/**
 * Calls the `invite-user` Supabase Edge Function to create a new auth user
 * and matching `profiles` row in a privileged, server-side boundary.
 */
export async function inviteUser(
  payload: InviteUserPayload,
): Promise<InviteUserResult | InviteUserError> {
  try {
    const { data, error } = await supabase.functions.invoke<{
      id?: string;
      message?: string;
      error?: string;
    }>("invite-user", {
      body: payload,
    });

    if (error || data?.error || !data?.id) {
      return {
        ok: false,
        error: error?.message || data?.error || "Invitation service is unavailable.",
      };
    }

    return {
      ok: true,
      id: data.id,
      message: data.message ?? "User created successfully.",
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Invitation failed." };
  }
}
