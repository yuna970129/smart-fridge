import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import type { IngredientStatus, ScannedItem } from "@/lib/types";

export const runtime = "nodejs";

// GET /api/fridge?status=have|gone|all — list ingredients.
export async function GET(req: NextRequest) {
  try {
    const status =
      (new URL(req.url).searchParams.get("status") as
        | IngredientStatus
        | "all"
        | null) ?? "have";
    const ingredients = await getStore().list(status ?? "have");
    return NextResponse.json({ ingredients });
  } catch (err) {
    console.error("fridge GET error:", err);
    return NextResponse.json(
      { error: "Could not load your fridge." },
      { status: 500 },
    );
  }
}

// POST /api/fridge — add items ({ items: [...] } or a single { name, emoji }).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: ScannedItem[] = Array.isArray(body.items)
      ? body.items
      : body.name
        ? [{ name: body.name, emoji: body.emoji ?? "" }]
        : [];
    if (!items.length) {
      return NextResponse.json({ error: "No items to add." }, { status: 400 });
    }
    const ingredients = await getStore().add(items);
    return NextResponse.json({ ingredients });
  } catch (err) {
    console.error("fridge POST error:", err);
    return NextResponse.json(
      { error: "Could not save items." },
      { status: 500 },
    );
  }
}

// PATCH /api/fridge — update status ({ id, status: 'have' | 'gone' }).
export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json();
    if (!id || (status !== "have" && status !== "gone")) {
      return NextResponse.json(
        { error: "A valid id and status are required." },
        { status: 400 },
      );
    }
    await getStore().setStatus(id, status);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("fridge PATCH error:", err);
    return NextResponse.json(
      { error: "Could not update item." },
      { status: 500 },
    );
  }
}

// DELETE /api/fridge — permanently remove an item ({ id }).
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "An id is required." }, { status: 400 });
    }
    await getStore().remove(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("fridge DELETE error:", err);
    return NextResponse.json(
      { error: "Could not delete item." },
      { status: 500 },
    );
  }
}
