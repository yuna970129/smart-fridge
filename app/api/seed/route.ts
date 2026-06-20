import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { emojiFor } from "@/lib/emoji";

export const runtime = "nodejs";

const DEMO_ITEMS = [
  "Eggs",
  "Carrot",
  "Ramen",
  "Garlic",
  "Butter",
  "Kimchi",
  "Green Onion",
];

// POST /api/seed — reset the fridge and load a demo inventory.
export async function POST() {
  try {
    const store = getStore();
    await store.reset();
    const ingredients = await store.add(
      DEMO_ITEMS.map((name) => ({ name, emoji: emojiFor(name) })),
    );
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
