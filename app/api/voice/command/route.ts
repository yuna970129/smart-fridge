import { NextRequest, NextResponse } from "next/server";
import { parseVoiceCommand, usingMockAI, describeAiError } from "@/lib/gemini";
import { getStore } from "@/lib/store";
import { shelfLifeFor } from "@/lib/shelflife";
import { emojiFor } from "@/lib/emoji";
import { daysLeft, freshnessLevel, toISODate } from "@/lib/freshness";
import type { Ingredient } from "@/lib/types";

export const runtime = "nodejs";

function addDaysISO(from: Date, days: number): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

// POST /api/voice/command  { transcript }
// → { action: "add" | "consume", dishName?, items }
//   - add:     items = [{ name, emoji, shelf_life_days, expires_at, days_left, freshness, adjusted }]
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
      const now = new Date();
      // Resolve expiry, accounting for spoken timing (onboarding):
      //   explicit "expires in N" > "bought N ago" (avg − N) > plain average.
      const items = cmd.items
        .filter((i) => i.name?.trim())
        .map((i) => {
          const name = i.name.trim();
          const shelf = shelfLifeFor(name);
          let expires_at: string;
          let adjusted = false;
          if (typeof i.expires_in_days === "number") {
            expires_at = addDaysISO(now, i.expires_in_days);
            adjusted = true;
          } else if (typeof i.purchased_days_ago === "number") {
            expires_at = addDaysISO(now, shelf - i.purchased_days_ago);
            adjusted = true;
          } else {
            expires_at = addDaysISO(now, shelf);
          }
          const dl = daysLeft(expires_at, now);
          return {
            name,
            emoji: i.emoji?.trim() || emojiFor(name),
            shelf_life_days: shelf,
            expires_at,
            days_left: dl,
            freshness: freshnessLevel(dl),
            adjusted,
          };
        });
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
