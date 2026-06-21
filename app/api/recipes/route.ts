import { NextResponse } from "next/server";
import { suggestRecipes, usingMockAI, describeAiError } from "@/lib/gemini";
import { getStore } from "@/lib/store";
import { withFreshness, type Freshness } from "@/lib/freshness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface RecipeFridgeItem {
  id: string;
  name: string;
  emoji: string;
  freshness: Freshness;
  days_left: number;
}

// GET /api/recipes — suggest recipes that use up (expiring) fridge items.
export async function GET() {
  try {
    const fridge = (await getStore().list("have")).map((i) => withFreshness(i));
    if (fridge.length === 0) {
      return NextResponse.json({ recipes: [], mock: usingMockAI, empty: true });
    }

    const suggestions = await suggestRecipes(
      fridge.map((f) => ({ name: f.name, expiring: f.freshness !== "fresh" })),
    );

    // Attach the matched fridge rows (id + freshness) so the UI can highlight
    // expiring items and build the "used it" checklist with real ids.
    const recipes = suggestions.map((r) => {
      const items: RecipeFridgeItem[] = [];
      const seen = new Set<string>();
      for (const name of r.fridgeIngredients) {
        const row = fridge.find(
          (f) => f.name.toLowerCase() === name.toLowerCase(),
        );
        if (row && !seen.has(row.id)) {
          seen.add(row.id);
          items.push({
            id: row.id,
            name: row.name,
            emoji: row.emoji,
            freshness: row.freshness,
            days_left: row.days_left,
          });
        }
      }
      return {
        emoji: r.emoji,
        name: r.name,
        fridgeIngredients: items,
        needToBuy: r.needToBuy,
        instructions: r.instructions,
        usesOnlyFridge: r.needToBuy.length === 0,
      };
    });

    return NextResponse.json({ recipes, mock: usingMockAI });
  } catch (err) {
    console.error("recipes error:", err);
    return NextResponse.json(
      { error: `Could not suggest recipes. ${describeAiError(err)}` },
      { status: 500 },
    );
  }
}
