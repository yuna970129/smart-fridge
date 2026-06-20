import { NextRequest, NextResponse } from "next/server";
import { analyzeDish, usingMockAI, describeAiError } from "@/lib/gemini";
import { getStore } from "@/lib/store";
import { parseDataUrl } from "@/lib/image";
import type { Ingredient } from "@/lib/types";

export const runtime = "nodejs";

// POST /api/check-dish — identify a cooked dish and which fridge items were used.
// Returns the matching fridge rows (with ids) so the client can update them.
export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "No image provided." }, { status: 400 });
    }

    const store = getStore();
    const fridge = await store.list("have");
    const { base64, mimeType } = parseDataUrl(image);
    const result = await analyzeDish(
      base64,
      mimeType,
      fridge.map((f) => f.name),
    );

    const matched: Ingredient[] = [];
    const seen = new Set<string>();
    for (const name of result.ingredients) {
      const row = fridge.find(
        (f) => f.name.toLowerCase() === name.toLowerCase(),
      );
      if (row && !seen.has(row.id)) {
        seen.add(row.id);
        matched.push(row);
      }
    }

    return NextResponse.json({
      dishName: result.dishName,
      ingredients: matched,
      mock: usingMockAI,
    });
  } catch (err) {
    console.error("check-dish error:", err);
    return NextResponse.json(
      {
        error: `Could not analyze the dish. ${describeAiError(err)}`,
        reason: describeAiError(err),
      },
      { status: 500 },
    );
  }
}
