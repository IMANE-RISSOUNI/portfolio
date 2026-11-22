import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./supabase-mapping";

export function createSupabaseClient() {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    db: { retry: false },
    global: {
      fetch: (input, init) => {
        const timeout = AbortSignal.timeout(5_000);
        const signal = init?.signal
          ? AbortSignal.any([timeout, init.signal])
          : timeout;
        return fetch(input, { ...init, signal });
      },
    },
  });
}
