export type IngredientStatus = "have" | "gone";

export interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  status: IngredientStatus;
  created_at: string;
}

/** A food item recognized by the AI before it is saved to the fridge. */
export interface ScannedItem {
  name: string;
  emoji: string;
}

/** Result of analyzing a cooked dish photo. */
export interface DishAnalysis {
  dishName: string;
  ingredients: Ingredient[];
}
