import { GoogleGenerativeAI } from "@google/generative-ai";
import { geminiApiKey, hasGemini, GEMINI_MODEL } from "./config";
import { emojiFor } from "./emoji";
import { shelfLifeFor } from "./shelflife";
import type { ScannedItem } from "./types";

const genAI = hasGemini ? new GoogleGenerativeAI(geminiApiKey!) : null;

/** True when no Gemini key is configured and the mock provider is in use. */
export const usingMockAI = !hasGemini;

/**
 * Turn a raw Gemini/network error into a short, user-facing reason. Helps the
 * user distinguish a bad key vs. quota vs. an unavailable model — instead of a
 * generic "could not read" message.
 */
export function describeAiError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/API[_ ]?KEY[_ ]?INVALID|API key not valid|\b400\b.*key/i.test(msg))
    return "The Gemini API key is invalid. Check GEMINI_API_KEY in .env.local.";
  if (/RESOURCE_EXHAUSTED|quota|rate limit|\b429\b/i.test(msg)) {
    const retry = /retry in ([\d.]+)s/i.exec(msg)?.[1];
    return `Gemini quota/rate limit hit${
      retry ? ` — retry in ~${Math.ceil(Number(retry))}s` : ""
    }. The "${GEMINI_MODEL}" model may not be enabled for this key's tier.`;
  }
  if (/NOT_FOUND|is not found|\b404\b/i.test(msg))
    return `The Gemini model "${GEMINI_MODEL}" is not available for this key. Set GEMINI_MODEL to one your key supports (e.g. gemini-2.5-flash).`;
  if (/PERMISSION_DENIED|\b403\b/i.test(msg))
    return "Gemini denied the request (permission). Verify the key and that the Generative Language API is enabled.";
  if (/Unable to process input image|INVALID_ARGUMENT/i.test(msg))
    return "Gemini could not process this image. Try a clearer JPG/PNG photo.";
  if (/\b503\b|UNAVAILABLE|overloaded|\b500\b|INTERNAL/i.test(msg))
    return `The "${GEMINI_MODEL}" model is temporarily overloaded. Please try again in a moment.`;
  return "AI request failed. See server logs for details.";
}

/** Transient errors worth retrying (model overloaded / temporarily unavailable). */
function isTransient(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /\b503\b|UNAVAILABLE|overloaded|\b500\b|INTERNAL|ECONNRESET|ETIMEDOUT|fetch failed|network/i.test(
    msg,
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Retry a Gemini call on transient failures (e.g. gemini-3.5-flash vision can
 * intermittently 503). Uses short exponential backoff so demos stay reliable.
 */
async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i === attempts - 1 || !isTransient(err)) throw err;
      const delay = 600 * 2 ** i + Math.floor(Math.random() * 250);
      console.warn(
        `Gemini transient error (attempt ${i + 1}/${attempts}), retrying in ${delay}ms`,
      );
      await sleep(delay);
    }
  }
  throw lastErr;
}

function parseJson<T>(text: string): T {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = cleaned.search(/[[{]/);
  const slice = start >= 0 ? cleaned.slice(start) : cleaned;
  return JSON.parse(slice) as T;
}

function normalizeItems(raw: unknown): ScannedItem[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: ScannedItem[] = [];
  for (const entry of raw) {
    const name =
      typeof entry === "string"
        ? entry
        : String((entry as { name?: unknown })?.name ?? "").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const emoji =
      (typeof entry === "object" &&
        entry &&
        String((entry as { emoji?: unknown }).emoji ?? "").trim()) ||
      emojiFor(name);
    out.push({ name, emoji, shelf_life_days: shelfLifeFor(name) });
    if (out.length >= 40) break;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Receipt analysis                                                    */
/* ------------------------------------------------------------------ */

export async function analyzeReceipt(
  base64Image: string,
  mimeType: string,
): Promise<ScannedItem[]> {
  if (!genAI) return mockReceipt();

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
  });

  const response = await withRetry(() =>
    model.generateContent([
      { inlineData: { data: base64Image, mimeType } },
      `Extract ONLY food and grocery items from this receipt.
Return a JSON array like [{"name":"Eggs","emoji":"🥚"}].
Rules:
- One fitting food emoji per item.
- English names in Title Case.
- No prices, store names, quantities, taxes, or totals.
- No duplicates.`,
    ]),
  );

  return normalizeItems(parseJson<unknown>(response.response.text()));
}

function mockReceipt(): ScannedItem[] {
  return [
    "Eggs",
    "Carrot",
    "Ramen",
    "Garlic",
    "Butter",
    "Kimchi",
    "Green Onion",
  ].map((name) => ({
    name,
    emoji: emojiFor(name),
    shelf_life_days: shelfLifeFor(name),
  }));
}

/* ------------------------------------------------------------------ */
/* Dish analysis                                                       */
/* ------------------------------------------------------------------ */

export interface RawDishResult {
  dishName: string;
  ingredients: string[];
}

export async function analyzeDish(
  base64Image: string,
  mimeType: string,
  fridgeItems: string[],
): Promise<RawDishResult> {
  if (!genAI) return mockDish(fridgeItems);

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
  });

  const response = await withRetry(() =>
    model.generateContent([
      { inlineData: { data: base64Image, mimeType } },
      `Identify this cooked dish and which of MY fridge ingredients were likely used.
My fridge has: ${fridgeItems.join(", ") || "(empty)"}
Return JSON: {"dishName":"Kimchi Jjigae","ingredients":["Kimchi","Garlic"]}
Rules:
- "ingredients" must ONLY contain items from my fridge list above (exact names).
- Be strict; include only ingredients clearly relevant to the dish.`,
    ]),
  );

  const raw = parseJson<RawDishResult>(response.response.text());
  return {
    dishName: String(raw?.dishName ?? "Unknown Dish").trim() || "Unknown Dish",
    ingredients: Array.isArray(raw?.ingredients)
      ? raw.ingredients.map((s) => String(s).trim()).filter(Boolean)
      : [],
  };
}

function mockDish(fridgeItems: string[]): RawDishResult {
  const lower = fridgeItems.map((f) => f.toLowerCase());
  const has = (name: string) => lower.includes(name.toLowerCase());

  if (has("Kimchi")) {
    const candidates = ["Kimchi", "Garlic", "Green Onion", "Onion", "Tofu", "Pork"];
    const used = fridgeItems.filter((f) =>
      candidates.some((c) => c.toLowerCase() === f.toLowerCase()),
    );
    return { dishName: "Kimchi Jjigae", ingredients: used.slice(0, 5) };
  }

  return {
    dishName: fridgeItems.length ? "Home Dish" : "Unknown Dish",
    ingredients: fridgeItems.slice(0, 4),
  };
}
