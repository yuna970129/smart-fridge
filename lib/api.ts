import type { Ingredient, IngredientStatus, ScannedItem } from "./types";
import type { FreshIngredient } from "./freshness";

async function jsonOrThrow(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

const JSON_HEADERS = { "Content-Type": "application/json" };

export async function scanReceipt(
  image: string,
): Promise<{ items: ScannedItem[]; mock: boolean }> {
  return jsonOrThrow(
    await fetch("/api/scan-receipt", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ image }),
    }),
  );
}

export async function checkDish(
  image: string,
): Promise<{ dishName: string; ingredients: Ingredient[]; mock: boolean }> {
  return jsonOrThrow(
    await fetch("/api/check-dish", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ image }),
    }),
  );
}

export async function getFridge(): Promise<FreshIngredient[]> {
  const data = await jsonOrThrow(
    await fetch("/api/fridge", { cache: "no-store" }),
  );
  return data.ingredients ?? [];
}

export async function addToFridge(items: ScannedItem[]): Promise<Ingredient[]> {
  const data = await jsonOrThrow(
    await fetch("/api/fridge", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ items }),
    }),
  );
  return data.ingredients ?? [];
}

export async function deleteIngredient(id: string): Promise<void> {
  await jsonOrThrow(
    await fetch("/api/fridge", {
      method: "DELETE",
      headers: JSON_HEADERS,
      body: JSON.stringify({ id }),
    }),
  );
}

export async function setIngredientStatus(
  id: string,
  status: IngredientStatus,
): Promise<void> {
  await jsonOrThrow(
    await fetch("/api/fridge", {
      method: "PATCH",
      headers: JSON_HEADERS,
      body: JSON.stringify({ id, status }),
    }),
  );
}

export async function seedFridge(): Promise<FreshIngredient[]> {
  const data = await jsonOrThrow(
    await fetch("/api/seed", { method: "POST" }),
  );
  return data.ingredients ?? [];
}
