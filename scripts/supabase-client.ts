import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase-mapping";

export class ScriptError extends Error {}

export function createScriptClient() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL) throw new ScriptError("Set SUPABASE_URL in .env.local.");
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new ScriptError("Set SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  }

  try {
    return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      db: { retry: false },
    });
  } catch {
    throw new ScriptError(
      "Could not configure the Supabase client. Check SUPABASE_URL.",
    );
  }
}

export function failScript(error: unknown) {
  console.error(
    error instanceof ScriptError
      ? error.message
      : "The operation failed. Check the database connection and local file permissions.",
  );
  process.exitCode = 1;
}
