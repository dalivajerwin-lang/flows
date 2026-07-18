import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

/**
 * Untyped alias — use for insert/update/delete calls where the hand-written
 * Database type causes 'never' inference on mutation parameters.
 * Select calls and auth operations should use the typed `supabase` above.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as any;
