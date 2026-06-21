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

/* ------------------------------------------------------------------ */
/* Voice command parsing — intent (add | consume) + items             */
/* ------------------------------------------------------------------ */

export type VoiceAction = "add" | "consume";

export interface VoiceCommand {
  action: VoiceAction;
  dishName?: string;
  items: ScannedItem[]; // { name, emoji }
}

export async function parseVoiceCommand(
  transcript: string,
  fridgeItems: string[],
): Promise<VoiceCommand> {
  if (!genAI) return mockVoiceCommand(transcript, fridgeItems);

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
  });

  const response = await withRetry(() =>
    model.generateContent(
      `You are a fridge assistant. Read the user's spoken sentence and decide ONE action:
- Bought / got groceries -> action "add": list the purchased food items.
- Cooked / used food      -> action "consume": give the dish + the ingredients used,
  matched against the current fridge: ${JSON.stringify(fridgeItems)}.
Return JSON:
{ "action": "add" | "consume",
  "dishName"?: string,
  "items": [{ "emoji": string, "name": string }] }
Rules:
- For "consume", "items" must ONLY contain names from the fridge list above.
- For "add", include every grocery the user mentioned, with a fitting food emoji.
- Names in English Title Case. The transcript may be Korean or English.

User said: "${transcript}"`,
    ),
  );

  const raw = parseJson<{
    action?: string;
    dishName?: string;
    items?: unknown;
  }>(response.response.text());

  const action: VoiceAction = raw?.action === "add" ? "add" : "consume";
  const items = normalizeItems(raw?.items);
  return {
    action,
    dishName: raw?.dishName ? String(raw.dishName).trim() : undefined,
    items,
  };
}

const ADD_HINTS = [
  "bought", "buy", "got", "purchased", "have", "there's", "there is", "stocked",
  "샀", "사 왔", "사왔", "구매", "있어", "있다", "샀어",
];
const CONSUME_HINTS = [
  "made", "cooked", "ate", "used", "끓였", "만들", "구웠", "먹었", "볶았", "삶았",
];

/** Keyword heuristic so the voice flow works without a Gemini key. */
function mockVoiceCommand(
  transcript: string,
  fridgeItems: string[],
): VoiceCommand {
  const t = transcript.toLowerCase();
  const isAdd =
    ADD_HINTS.some((h) => t.includes(h)) &&
    !CONSUME_HINTS.some((h) => t.includes(h));

  if (isAdd) {
    // Pull capitalized-ish nouns out of the sentence as grocery names.
    const stop = new Set([
      "i","bought","buy","got","have","some","a","an","the","and","of","with","from",
      "mart","store","today","just","two","three","couple","few","there","is","also",
      "my","fridge","in","there's","stocked","purchased",
    ]);
    const words = transcript
      .replace(/[.,!?]/g, " ")
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w && !stop.has(w.toLowerCase()) && !/^\d+$/.test(w));
    const seen = new Set<string>();
    const items: ScannedItem[] = [];
    for (const w of words) {
      const name = w[0].toUpperCase() + w.slice(1).toLowerCase();
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({ name, emoji: emojiFor(name) });
      if (items.length >= 12) break;
    }
    return { action: "add", items };
  }

  // consume: match fridge items mentioned in the transcript
  const used = fridgeItems.filter((f) => {
    const name = f.toLowerCase();
    if (t.includes(name)) return true;
    if (name.endsWith("s") && t.includes(name.slice(0, -1))) return true;
    return false;
  });
  let dishName = "Home Dish";
  if (t.includes("ramen") || t.includes("라면")) dishName = "Ramen";
  else if (t.includes("kimchi") || t.includes("김치")) dishName = "Kimchi Jjigae";
  return {
    action: "consume",
    dishName,
    items: used.map((name) => ({ name, emoji: emojiFor(name) })),
  };
}


/* ------------------------------------------------------------------ */
/* Smart recipe suggestions from (expiring) fridge items              */
/* ------------------------------------------------------------------ */

export interface RecipeSuggestion {
  emoji: string;
  name: string;
  /** Ingredient names that come from the fridge (must match fridge items). */
  fridgeIngredients: string[];
  /** Extra ingredients the user would need to buy. */
  needToBuy: string[];
  /** Step-by-step instructions. */
  instructions: string[];
}

export interface RecipeContextItem {
  name: string;
  expiring: boolean;
}

export async function suggestRecipes(
  items: RecipeContextItem[],
): Promise<RecipeSuggestion[]> {
  const fridgeNames = items.map((i) => i.name);
  const expiring = items.filter((i) => i.expiring).map((i) => i.name);

  if (!genAI) return mockRecipes(items);

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
  });

  const response = await withRetry(() =>
    model.generateContent(
      `You are a home-cooking assistant. Suggest 3 recipes that use up my fridge
ingredients, PRIORITIZING the ones that are expiring soon.

My fridge: ${JSON.stringify(fridgeNames)}
Expiring soon (use these first): ${JSON.stringify(expiring.length ? expiring : fridgeNames)}

Rules:
- Recipe 1 MUST use ONLY fridge items (empty "needToBuy").
- Recipes 2 and 3 may add a few common extra items ("needToBuy").
- "fridgeIngredients" must be names taken EXACTLY from my fridge list.
- Keep instructions to 3-5 short steps.
Return JSON:
{ "recipes": [
  { "emoji": "🍳", "name": "Fried Rice",
    "fridgeIngredients": ["Carrot","Eggs"],
    "needToBuy": [],
    "instructions": ["Chop the carrot", "Fry with rice and egg", "Season and serve"] }
] }`,
    ),
  );

  const raw = parseJson<{ recipes?: unknown }>(response.response.text());
  const list = Array.isArray(raw?.recipes) ? raw.recipes : [];
  const fridgeLower = new Map(fridgeNames.map((n) => [n.toLowerCase(), n]));

  const recipes: RecipeSuggestion[] = [];
  for (const entry of list) {
    const r = entry as Record<string, unknown>;
    const name = String(r.name ?? "").trim();
    if (!name) continue;
    // Keep only real fridge names; everything else becomes "need to buy".
    const fridgeIngredients: string[] = [];
    for (const ing of Array.isArray(r.fridgeIngredients) ? r.fridgeIngredients : []) {
      const canonical = fridgeLower.get(String(ing).trim().toLowerCase());
      if (canonical && !fridgeIngredients.includes(canonical)) {
        fridgeIngredients.push(canonical);
      }
    }
    const needToBuy = (Array.isArray(r.needToBuy) ? r.needToBuy : [])
      .map((s) => String(s).trim())
      .filter(Boolean);
    const instructions = (Array.isArray(r.instructions) ? r.instructions : [])
      .map((s) => String(s).trim())
      .filter(Boolean);
    recipes.push({
      emoji: String(r.emoji ?? "").trim() || "🍲",
      name,
      fridgeIngredients,
      needToBuy,
      instructions,
    });
    if (recipes.length >= 3) break;
  }
  return recipes.length ? recipes : mockRecipes(items);
}

/** Deterministic recipe suggestions when no Gemini key is configured. */
function mockRecipes(items: RecipeContextItem[]): RecipeSuggestion[] {
  const names = items.map((i) => i.name);
  const has = (n: string) => names.some((x) => x.toLowerCase() === n.toLowerCase());
  // Prefer expiring items, then the rest, as the "hero" ingredients.
  const ordered = [
    ...items.filter((i) => i.expiring).map((i) => i.name),
    ...items.filter((i) => !i.expiring).map((i) => i.name),
  ];
  const pick = (n: number) => ordered.slice(0, n);

  const recipes: RecipeSuggestion[] = [];

  // 1) Fridge-only
  recipes.push({
    emoji: "🍳",
    name: has("Eggs") ? "Veggie Fried Rice" : "Fridge Stir-Fry",
    fridgeIngredients: pick(3),
    needToBuy: [],
    instructions: [
      "Chop the fridge ingredients.",
      "Stir-fry over medium-high heat.",
      "Season with salt and pepper, then serve.",
    ],
  });

  // 2) Fridge + add-ons
  recipes.push({
    emoji: "🍲",
    name: "Hearty Veggie Soup",
    fridgeIngredients: pick(2),
    needToBuy: ["Broth", "Potato"],
    instructions: [
      "Chop all vegetables.",
      "Add broth and bring to a boil.",
      "Simmer 20 minutes and serve hot.",
    ],
  });

  // 3) Fridge + add-ons
  recipes.push({
    emoji: "🥗",
    name: "Fresh Garden Salad",
    fridgeIngredients: pick(2),
    needToBuy: ["Lettuce", "Dressing"],
    instructions: [
      "Wash and slice the vegetables.",
      "Toss everything in a bowl.",
      "Drizzle with dressing and enjoy.",
    ],
  });

  return recipes;
}
