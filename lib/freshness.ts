import type { Ingredient } from "./types";

export type Freshness = "fresh" | "expiring" | "expired";

/** Day boundary, so "days left" ignores the time-of-day component. */
function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Format a Date as a local-time `YYYY-MM-DD` string (no UTC shift). */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse `YYYY-MM-DD` as LOCAL midnight (Date's default treats it as UTC). */
function parseLocalDate(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(value);
}

/** Whole days from today until `expires_at` (negative = already expired). */
export function daysLeft(expiresAt: string, now: Date = new Date()): number {
  const exp = startOfDay(parseLocalDate(expiresAt));
  const today = startOfDay(now);
  return Math.round((exp.getTime() - today.getTime()) / 86_400_000);
}

/** Status thresholds from the v2 scenario: >3 fresh, ≤3 expiring, ≤0 expired. */
export function freshnessLevel(days: number): Freshness {
  if (days <= 0) return "expired";
  if (days <= 3) return "expiring";
  return "fresh";
}

export interface FreshIngredient extends Ingredient {
  days_left: number;
  freshness: Freshness;
}

export function withFreshness(
  ing: Ingredient,
  now: Date = new Date(),
): FreshIngredient {
  const days = daysLeft(ing.expires_at, now);
  return { ...ing, days_left: days, freshness: freshnessLevel(days) };
}

/** Human-readable "days left" label. */
export function freshnessLabel(days: number): string {
  if (days < 0) return "Expired";
  if (days === 0) return "Expires today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

export const FRESHNESS_DOT: Record<Freshness, string> = {
  fresh: "🟢",
  expiring: "🟡",
  expired: "🔴",
};
