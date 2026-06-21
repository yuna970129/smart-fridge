import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { DEMO_USER, hasSupabase } from "./config";
import { getSupabase } from "./supabase";
import { emojiFor } from "./emoji";
import { shelfLifeFor } from "./shelflife";
import { toISODate } from "./freshness";
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

/** ISO date `n` days after `from` (date-only, e.g. "2026-07-20"). */
function addDaysISO(from: Date, days: number): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Resolve shelf life + expiry for a scanned item at save time. */
function resolveExpiry(
  item: ScannedItem,
  now: Date,
): { shelf_life_days: number; expires_at: string } {
  const shelf_life_days = item.shelf_life_days ?? shelfLifeFor(item.name);

  // Precedence: explicit expires_at > explicit remaining days > purchase-time
  // adjustment (avg − days since bought) > plain category average.
  let expires_at: string;
  if (item.expires_at) {
    expires_at = item.expires_at;
  } else if (typeof item.expires_in_days === "number") {
    expires_at = addDaysISO(now, item.expires_in_days);
  } else if (typeof item.purchased_days_ago === "number") {
    expires_at = addDaysISO(now, shelf_life_days - item.purchased_days_ago);
  } else {
    expires_at = addDaysISO(now, shelf_life_days);
  }
  return { shelf_life_days, expires_at };
}

function toIngredient(row: Record<string, unknown>): Ingredient {
  const name = String(row.name);
  const created_at = String(row.created_at ?? new Date().toISOString());
  const shelf_life_days =
    typeof row.shelf_life_days === "number"
      ? row.shelf_life_days
      : Number(row.shelf_life_days) || shelfLifeFor(name);
  const expires_at = row.expires_at
    ? String(row.expires_at)
    : addDaysISO(new Date(created_at), shelf_life_days);
  return {
    id: String(row.id),
    name,
    emoji: String(row.emoji ?? emojiFor(name)),
    status: (row.status as IngredientStatus) ?? "have",
    created_at,
    shelf_life_days,
    expires_at,
  };
}

/* ------------------------------------------------------------------ */
/* Local JSON store (default fallback — no external services needed)   */
/* ------------------------------------------------------------------ */

class JsonStore implements FridgeStore {
  private dir = process.env.DATA_DIR || path.join(process.cwd(), ".data");
  private file = path.join(
    process.env.DATA_DIR || path.join(process.cwd(), ".data"),
    "fridge.json",
  );

  // Always read from disk so the file is the single source of truth. In Next's
  // production build the page and API routes live in separate bundles (separate
  // module singletons), so an in-memory cache would go stale across them.
  private async readAll(): Promise<Ingredient[]> {
    try {
      const raw = await fs.readFile(this.file, "utf8");
      const parsed = JSON.parse(raw) as Record<string, unknown>[];
      // Normalize legacy rows that predate expiry tracking.
      return parsed.map(toIngredient);
    } catch {
      return [];
    }
  }

  private async writeAll(items: Ingredient[]): Promise<void> {
    try {
      await fs.mkdir(this.dir, { recursive: true });
      await fs.writeFile(this.file, JSON.stringify(items, null, 2));
    } catch {
      // best-effort: a read-only FS just means changes don't persist
    }
  }

  async list(status: IngredientStatus | "all" = "have"): Promise<Ingredient[]> {
    const all = await this.readAll();
    const items = status === "all" ? all : all.filter((i) => i.status === status);
    // Soonest-to-expire first so urgent items surface at the top.
    return items.sort((a, b) => a.expires_at.localeCompare(b.expires_at));
  }

  async add(items: ScannedItem[]): Promise<Ingredient[]> {
    const all = await this.readAll();
    const now = new Date();
    const result: Ingredient[] = [];
    for (const item of items) {
      const name = item.name?.trim();
      if (!name) continue;
      const emoji = item.emoji?.trim() || emojiFor(name);
      const { shelf_life_days, expires_at } = resolveExpiry(item, now);
      const existing = all.find(
        (i) => i.name.toLowerCase() === name.toLowerCase(),
      );
      if (existing) {
        existing.status = "have";
        existing.created_at = now.toISOString();
        existing.shelf_life_days = shelf_life_days;
        existing.expires_at = expires_at;
        if (!existing.emoji) existing.emoji = emoji;
        result.push(existing);
      } else {
        const ing: Ingredient = {
          id: randomUUID(),
          name,
          emoji,
          status: "have",
          created_at: now.toISOString(),
          shelf_life_days,
          expires_at,
        };
        all.push(ing);
        result.push(ing);
      }
    }
    await this.writeAll(all);
    return result;
  }

  async remove(id: string): Promise<void> {
    const all = await this.readAll();
    await this.writeAll(all.filter((i) => i.id !== id));
  }

  async setStatus(id: string, status: IngredientStatus): Promise<void> {
    const all = await this.readAll();
    const item = all.find((i) => i.id === id);
    if (item) item.status = status;
    await this.writeAll(all);
  }

  async reset(): Promise<void> {
    await this.writeAll([]);
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
      .order("expires_at", { ascending: true });
    if (status !== "all") query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map(toIngredient);
  }

  async add(items: ScannedItem[]): Promise<Ingredient[]> {
    const sb = getSupabase()!;
    const now = new Date();
    const { data: existingRows } = await sb
      .from("ingredients")
      .select("*")
      .eq("user_id", DEMO_USER);
    const existing = (existingRows ?? []).map(toIngredient);

    const result: Ingredient[] = [];
    const toInsert: {
      user_id: string;
      name: string;
      emoji: string;
      status: string;
      expires_at: string;
      shelf_life_days: number;
    }[] = [];
    const queued = new Set<string>();

    for (const item of items) {
      const name = item.name?.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      const emoji = item.emoji?.trim() || emojiFor(name);
      const { shelf_life_days, expires_at } = resolveExpiry(item, now);
      const match = existing.find((i) => i.name.toLowerCase() === key);
      if (match) {
        await sb
          .from("ingredients")
          .update({ status: "have", expires_at, shelf_life_days })
          .eq("id", match.id);
        match.status = "have";
        match.expires_at = expires_at;
        match.shelf_life_days = shelf_life_days;
        result.push(match);
      } else if (!queued.has(key)) {
        queued.add(key);
        toInsert.push({
          user_id: DEMO_USER,
          name,
          emoji,
          status: "have",
          expires_at,
          shelf_life_days,
        });
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
