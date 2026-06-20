import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { DEMO_USER, hasSupabase } from "./config";
import { getSupabase } from "./supabase";
import { emojiFor } from "./emoji";
import type { Ingredient, IngredientStatus, ScannedItem } from "./types";

export interface FridgeStore {
  /** List ingredients for the demo user. Defaults to the "have" inventory. */
  list(status?: IngredientStatus | "all"): Promise<Ingredient[]>;
  /** Add scanned items (deduped by name). Re-activates "gone" items. */
  add(items: ScannedItem[]): Promise<Ingredient[]>;
  /** Permanently delete an ingredient. */
  remove(id: string): Promise<void>;
  /** Update an ingredient's status (e.g. mark "gone" when used up). */
  setStatus(id: string, status: IngredientStatus): Promise<void>;
  /** Clear all ingredients for the demo user. */
  reset(): Promise<void>;
}

function toIngredient(row: Record<string, unknown>): Ingredient {
  return {
    id: String(row.id),
    name: String(row.name),
    emoji: String(row.emoji ?? emojiFor(String(row.name))),
    status: (row.status as IngredientStatus) ?? "have",
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

/* ------------------------------------------------------------------ */
/* Local JSON store (default fallback — no external services needed)   */
/* ------------------------------------------------------------------ */

class JsonStore implements FridgeStore {
  private cache: Ingredient[] | null = null;
  private dir = process.env.DATA_DIR || path.join(process.cwd(), ".data");
  private file = path.join(
    process.env.DATA_DIR || path.join(process.cwd(), ".data"),
    "fridge.json",
  );

  private async load(): Promise<Ingredient[]> {
    if (this.cache) return this.cache;
    try {
      const raw = await fs.readFile(this.file, "utf8");
      this.cache = JSON.parse(raw) as Ingredient[];
    } catch {
      this.cache = [];
    }
    return this.cache;
  }

  private async persist(): Promise<void> {
    try {
      await fs.mkdir(this.dir, { recursive: true });
      await fs.writeFile(this.file, JSON.stringify(this.cache ?? [], null, 2));
    } catch {
      // best-effort: keep working from the in-memory cache
    }
  }

  async list(status: IngredientStatus | "all" = "have"): Promise<Ingredient[]> {
    const all = await this.load();
    const items = status === "all" ? all : all.filter((i) => i.status === status);
    return [...items].sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  async add(items: ScannedItem[]): Promise<Ingredient[]> {
    const all = await this.load();
    const result: Ingredient[] = [];
    for (const item of items) {
      const name = item.name?.trim();
      if (!name) continue;
      const emoji = item.emoji?.trim() || emojiFor(name);
      const existing = all.find(
        (i) => i.name.toLowerCase() === name.toLowerCase(),
      );
      if (existing) {
        existing.status = "have";
        if (!existing.emoji) existing.emoji = emoji;
        result.push(existing);
      } else {
        const ing: Ingredient = {
          id: randomUUID(),
          name,
          emoji,
          status: "have",
          created_at: new Date().toISOString(),
        };
        all.push(ing);
        result.push(ing);
      }
    }
    await this.persist();
    return result;
  }

  async remove(id: string): Promise<void> {
    const all = await this.load();
    this.cache = all.filter((i) => i.id !== id);
    await this.persist();
  }

  async setStatus(id: string, status: IngredientStatus): Promise<void> {
    const all = await this.load();
    const item = all.find((i) => i.id === id);
    if (item) item.status = status;
    await this.persist();
  }

  async reset(): Promise<void> {
    this.cache = [];
    await this.persist();
  }
}

/* ------------------------------------------------------------------ */
/* Supabase store (used when credentials are configured)               */
/* ------------------------------------------------------------------ */

class SupabaseStore implements FridgeStore {
  async list(status: IngredientStatus | "all" = "have"): Promise<Ingredient[]> {
    const sb = getSupabase()!;
    let query = sb
      .from("ingredients")
      .select("*")
      .eq("user_id", DEMO_USER)
      .order("created_at", { ascending: true });
    if (status !== "all") query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map(toIngredient);
  }

  async add(items: ScannedItem[]): Promise<Ingredient[]> {
    const sb = getSupabase()!;
    const { data: existingRows } = await sb
      .from("ingredients")
      .select("*")
      .eq("user_id", DEMO_USER);
    const existing = (existingRows ?? []).map(toIngredient);

    const result: Ingredient[] = [];
    const toInsert: { user_id: string; name: string; emoji: string; status: string }[] = [];
    const queued = new Set<string>();

    for (const item of items) {
      const name = item.name?.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      const emoji = item.emoji?.trim() || emojiFor(name);
      const match = existing.find((i) => i.name.toLowerCase() === key);
      if (match) {
        if (match.status !== "have") {
          await sb.from("ingredients").update({ status: "have" }).eq("id", match.id);
          match.status = "have";
        }
        result.push(match);
      } else if (!queued.has(key)) {
        queued.add(key);
        toInsert.push({ user_id: DEMO_USER, name, emoji, status: "have" });
      }
    }

    if (toInsert.length) {
      const { data: inserted, error } = await sb
        .from("ingredients")
        .insert(toInsert)
        .select();
      if (error) throw new Error(error.message);
      for (const row of inserted ?? []) result.push(toIngredient(row));
    }
    return result;
  }

  async remove(id: string): Promise<void> {
    const sb = getSupabase()!;
    const { error } = await sb
      .from("ingredients")
      .delete()
      .eq("id", id)
      .eq("user_id", DEMO_USER);
    if (error) throw new Error(error.message);
  }

  async setStatus(id: string, status: IngredientStatus): Promise<void> {
    const sb = getSupabase()!;
    const { error } = await sb
      .from("ingredients")
      .update({ status })
      .eq("id", id)
      .eq("user_id", DEMO_USER);
    if (error) throw new Error(error.message);
  }

  async reset(): Promise<void> {
    const sb = getSupabase()!;
    await sb.from("ingredients").delete().eq("user_id", DEMO_USER);
  }
}

let store: FridgeStore | null = null;

export function getStore(): FridgeStore {
  if (!store) store = hasSupabase ? new SupabaseStore() : new JsonStore();
  return store;
}

/** True when running on the local JSON fallback (no Supabase configured). */
export const usingLocalStore = !hasSupabase;
