/**
 * Central runtime configuration.
 *
 * The app is designed to run with OR without real credentials so it can be
 * demoed instantly (hackathon mode). Placeholder values from `.env.example`
 * are treated as "absent" so we transparently fall back to the local JSON
 * store + the deterministic mock AI provider.
 */

function clean(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const v = value.trim();
  if (!v) return undefined;
  // Reject obvious placeholders shipped in .env.example
  if (/xxx|your-|project-id|changeme|replace_me|<.+>/i.test(v)) return undefined;
  return v;
}

export const DEMO_USER = clean(process.env.DEMO_USER_ID) ?? "demo-user";
export const GEMINI_MODEL = clean(process.env.GEMINI_MODEL) ?? "gemini-2.5-flash";

export const supabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabaseAnonKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const supabaseServiceKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
export const geminiApiKey = clean(process.env.GEMINI_API_KEY);
export const bizcrushApiKey = clean(process.env.BIZCRUSH_API_KEY);

export const hasSupabase = Boolean(
  supabaseUrl && (supabaseServiceKey || supabaseAnonKey),
);
export const hasGemini = Boolean(geminiApiKey);
export const hasBizcrush = Boolean(bizcrushApiKey);

/**
 * Which engine transcribes voice input:
 * - "bizcrush": BizCrush live STT (speech→text) → Gemini (text→intent). Two hops,
 *   streams live interim text.
 * - "gemini": Gemini multimodal handles audio directly (speech→intent in ONE
 *   call). Faster, no live interim.
 * Defaults to gemini when a Gemini key exists (faster), else bizcrush.
 */
export type VoiceProvider = "bizcrush" | "gemini";
export const voiceProvider: VoiceProvider =
  clean(process.env.VOICE_PROVIDER) === "bizcrush"
    ? "bizcrush"
    : clean(process.env.VOICE_PROVIDER) === "gemini"
      ? "gemini"
      : hasGemini
        ? "gemini"
        : "bizcrush";
