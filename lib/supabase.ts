import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  hasSupabase,
  supabaseUrl,
  supabaseAnonKey,
  supabaseServiceKey,
} from "./config";

let client: SupabaseClient | null = null;

/**
 * Returns a Supabase client when credentials are configured, otherwise null.
 * Prefers the service-role key (server-side, bypasses RLS) and falls back to
 * the anon key.
 */
export function getSupabase(): SupabaseClient | null {
  if (!hasSupabase) return null;
  if (!client) {
    client = createClient(supabaseUrl!, supabaseServiceKey ?? supabaseAnonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
