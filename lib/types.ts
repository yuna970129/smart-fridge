export type IngredientStatus = "have" | "gone";

export interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  status: IngredientStatus;
  created_at: string;
  /** Auto-assigned: created_at + shelf_life_days (ISO date). */
  expires_at: string;
  /** Category-average shelf life used to compute expires_at. */
  shelf_life_days: number;
}

/** A food item recognized by the AI before it is saved to the fridge. */
export interface ScannedItem {
  name: string;
  emoji: string;
  /** Category-average shelf life (days); attached by the analyzer. */
  shelf_life_days?: number;
  /** Optional explicit expiry override (used by the demo seed). */
  expires_at?: string;
}

/** Result of analyzing a cooked dish photo. */
export interface DishAnalysis {
  dishName: string;
  ingredients: Ingredient[];
}
