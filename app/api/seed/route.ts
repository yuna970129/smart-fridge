import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { withFreshness, toISODate } from "@/lib/freshness";
import { emojiFor } from "@/lib/emoji";
import { shelfLifeFor } from "@/lib/shelflife";
import type { ScannedItem } from "@/lib/types";

export const runtime = "nodejs";

// Demo inventory matching the scenario's "Day 3: Fridge Management" example,
// crafted to show all freshness states (🟢🟡🔴) + the alert banner.
// `inDays` is the offset from today used for expires_at; `emoji` overrides the lookup.
const DEMO: { name: string; inDays: number; emoji?: string }[] = [
  { name: "Eggs", inDays: 28 }, // 🟢 fresh
  { name: "Ramen", inDays: 175 }, // 🟢 fresh
  { name: "Butter", inDays: 85 }, // 🟢 fresh
  { name: "Garlic", inDays: 58 }, // 🟢 fresh
  { name: "Kimchi", inDays: 25 }, // 🟢 fresh
  { name: "Carrot", inDays: 2 }, // 🟡 expiring soon
  { name: "Green Onion", inDays: 1 }, // 🟡 expiring soon
  { name: "Ham", inDays: -1, emoji: "🥓" }, // 🔴 expired
];

function expiryISO(inDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + inDays);
  return toISODate(d);
}

function demoItems(): ScannedItem[] {
  return DEMO.map(({ name, inDays, emoji }) => ({
    name,
    emoji: emoji ?? emojiFor(name),
    shelf_life_days: shelfLifeFor(name),
    expires_at: expiryISO(inDays),
  }));
}

// POST /api/seed — reset the fridge and load a demo inventory.
export async function POST() {
  try {
    const store = getStore();
    await store.reset();
    const saved = await store.add(demoItems());
    const ingredients = saved.map((i) => withFreshness(i));
    return NextResponse.json({ ingredients });
  } catch (err) {
    console.error("seed error:", err);
    return NextResponse.json({ error: "Could not seed." }, { status: 500 });
  }
}

// DELETE /api/seed — clear the fridge.
export async function DELETE() {
  try {
    await getStore().reset();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("reset error:", err);
    return NextResponse.json({ error: "Could not reset." }, { status: 500 });
  }
}
