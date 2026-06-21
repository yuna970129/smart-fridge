import { shelfLifeFor } from "./shelflife";
import { emojiFor } from "./emoji";
import { daysLeft, freshnessLevel, toISODate, type Freshness } from "./freshness";
import type { Ingredient } from "./types";
import type { VoiceCommand } from "./gemini";

function addDaysISO(from: Date, days: number): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export interface VoiceAddItem {
  name: string;
  emoji: string;
  shelf_life_days: number;
  expires_at: string;
  days_left: number;
  freshness: Freshness;
  adjusted: boolean;
}

export interface VoiceCommandResponse {
  action: "add" | "consume";
  dishName?: string;
  items: VoiceAddItem[] | Ingredient[];
  transcript?: string;
  mock: boolean;
}

/**
 * Turn a parsed voice command into the client response shape, shared by the
 * text (BizCrush→Gemini) and audio (Gemini-direct) routes.
 * - add:     resolves per-item expiry (explicit > purchase-aged > average)
 * - consume: matches the spoken items against current fridge rows (with ids)
 */
export function buildCommandResponse(
  cmd: VoiceCommand,
  fridge: Ingredient[],
  mock: boolean,
): VoiceCommandResponse {
  if (cmd.action === "add") {
    const now = new Date();
    const items: VoiceAddItem[] = cmd.items
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
    return { action: "add", items, transcript: cmd.transcript, mock };
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
  return {
    action: "consume",
    dishName: cmd.dishName ?? "Home Dish",
    items: matched,
    transcript: cmd.transcript,
    mock,
  };
}
