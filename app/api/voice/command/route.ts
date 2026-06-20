import { NextRequest, NextResponse } from "next/server";
import { parseVoiceCommand, usingMockAI, describeAiError } from "@/lib/gemini";
import { getStore } from "@/lib/store";
import { shelfLifeFor } from "@/lib/shelflife";
import { emojiFor } from "@/lib/emoji";
import type { Ingredient } from "@/lib/types";

export const runtime = "nodejs";

// POST /api/voice/command  { transcript }
// → { action: "add" | "consume", dishName?, items }
//   - add:     items = [{ name, emoji, shelf_life_days }]  (not yet saved)
//   - consume: items = matched fridge rows (with ids) to mark gone
export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();
    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json(
        { error: "No transcript provided." },
        { status: 400 },
      );
    }

    const fridge = await getStore().list("have");
    const cmd = await parseVoiceCommand(
      transcript,
      fridge.map((f) => f.name),
    );

    if (cmd.action === "add") {
      // Attach emoji + category shelf life so the confirm list can show (Avg Xd).
      const items = cmd.items
        .filter((i) => i.name?.trim())
        .map((i) => ({
          name: i.name.trim(),
          emoji: i.emoji?.trim() || emojiFor(i.name),
          shelf_life_days: shelfLifeFor(i.name),
        }));
      return NextResponse.json({
        action: "add",
        items,
        mock: usingMockAI,
      });
    }

    // consume → match against current fridge rows
    const matched: Ingredient[] = [];
    const seen = new Set<string>();
    for (const item of cmd.items) {
      const row = fridge.find(
        (f) => f.name.toLowerCase() === item.name.toLowerCase(),
      );
      if (row && !seen.has(row.id)) {
        seen.add(row.id);
        matched.push(row);
      }
    }
    return NextResponse.json({
      action: "consume",
      dishName: cmd.dishName ?? "Home Dish",
      items: matched,
      mock: usingMockAI,
    });
  } catch (err) {
    console.error("voice command error:", err);
    return NextResponse.json(
      { error: `Could not understand that. ${describeAiError(err)}` },
      { status: 500 },
    );
  }
}
