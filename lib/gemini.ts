import { GoogleGenerativeAI } from "@google/generative-ai";
import { geminiApiKey, hasGemini, GEMINI_MODEL } from "./config";
import { emojiFor } from "./emoji";
import type { ScannedItem } from "./types";

const genAI = hasGemini ? new GoogleGenerativeAI(geminiApiKey!) : null;

/** True when no Gemini key is configured and the mock provider is in use. */
export const usingMockAI = !hasGemini;

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
    out.push({ name, emoji });
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

  const response = await model.generateContent([
    { inlineData: { data: base64Image, mimeType } },
    `Extract ONLY food and grocery items from this receipt.
Return a JSON array like [{"name":"Eggs","emoji":"🥚"}].
Rules:
- One fitting food emoji per item.
- English names in Title Case.
- No prices, store names, quantities, taxes, or totals.
- No duplicates.`,
  ]);

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
  ].map((name) => ({ name, emoji: emojiFor(name) }));
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

  const response = await model.generateContent([
    { inlineData: { data: base64Image, mimeType } },
    `Identify this cooked dish and which of MY fridge ingredients were likely used.
My fridge has: ${fridgeItems.join(", ") || "(empty)"}
Return JSON: {"dishName":"Kimchi Jjigae","ingredients":["Kimchi","Garlic"]}
Rules:
- "ingredients" must ONLY contain items from my fridge list above (exact names).
- Be strict; include only ingredients clearly relevant to the dish.`,
  ]);

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
