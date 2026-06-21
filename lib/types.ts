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
  /**
   * Voice onboarding: how many days ago the item was bought. The remaining
   * shelf life is reduced accordingly (e.g. bought 3 days ago → avg − 3 days).
   */
  purchased_days_ago?: number;
  /**
   * Voice onboarding: explicit remaining days until expiry, when the user
   * states it directly (e.g. "carrot that expires in 2 weeks" → 14).
   */
  expires_in_days?: number;
}

/** Result of analyzing a cooked dish photo. */
export interface DishAnalysis {
  dishName: string;
  ingredients: Ingredient[];
}
