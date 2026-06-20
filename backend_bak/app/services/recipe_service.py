"""Recipe service — urgent-first recommendation (§6-3) + "made it" deduction (§6-4)."""

from __future__ import annotations

from sqlalchemy.orm import Session, selectinload

from app.core.constants import DEFAULT_TOP_K, W_MISSING_PENALTY, W_URGENT_BONUS
from app.models import Recipe, RecipeIngredient
from app.models.enums import InventoryStatus, Source
from app.providers.recipe import get_recipe_source
from app.schemas.consumption import ConsumptionResult, ConsumptionResultItem
from app.schemas.recipe import (
    RecipeCandidate,
    RecipeIngredientOut,
    RecipeMatch,
    RecipeOut,
    RecommendationResponse,
    ShoppingListItem,
)
from app.services.inventory_service import InventoryService
from app.services.normalization import IngredientNormalizer


class RecipeService:
    def __init__(self, db: Session, normalizer: IngredientNormalizer) -> None:
        self.db = db
        self.normalizer = normalizer
        self.inventory = InventoryService(db)
        self.source = get_recipe_source()

    # ── recommendation (PLAN §6-3) ───────────────────────────────────────────
    def recommend(self, *, user_id: int, k: int = DEFAULT_TOP_K) -> RecommendationResponse:
        items = self.inventory.list_items(user_id, status=InventoryStatus.ACTIVE.value)
        available = {i.ingredient_name for i in items if i.ingredient_name and i.quantity > 0}
        urgent = {i.ingredient_name for i in items if i.is_urgent and i.ingredient_name}

        candidates = self.source.suggest(
            db=self.db,
            available=sorted(available),
            urgent=sorted(urgent),
            k=max(k * 2, k),
        )

        matches = [self._score(c, available, urgent) for c in candidates]
        matches = [m for m in matches if m.completeness > 0 or not available]
        matches.sort(key=lambda m: m.score, reverse=True)
        top = matches[:k]

        shopping: dict[str, list[str]] = {}
        for m in top:
            for miss in m.missing:
                shopping.setdefault(miss, []).append(m.recipe.name)

        return RecommendationResponse(
            matches=top,
            shopping_list=[
                ShoppingListItem(name=n, needed_by_recipes=r) for n, r in shopping.items()
            ],
            urgent_ingredients=sorted(urgent),
        )

    def _score(
        self, c: RecipeCandidate, available: set[str], urgent: set[str]
    ) -> RecipeMatch:
        avail_lc = {a.lower() for a in available}
        urgent_lc = {u.lower() for u in urgent}

        essential = [i for i in c.ingredients if i.is_essential]
        essential = essential or c.ingredients  # avoid div-by-zero
        have, missing, uses_urgent = [], [], []
        for ing in essential:
            if ing.name.lower() in avail_lc:
                have.append(ing.name)
            else:
                missing.append(ing.name)
        for ing in c.ingredients:
            if ing.name.lower() in urgent_lc:
                uses_urgent.append(ing.name)

        completeness = len(have) / len(essential) if essential else 0.0
        score = (
            completeness
            + (W_URGENT_BONUS if uses_urgent else 0.0)
            - W_MISSING_PENALTY * len(missing)
        )
        return RecipeMatch(
            recipe=self._candidate_to_out(c),
            score=round(score, 4),
            completeness=round(completeness, 4),
            have=have,
            missing=missing,
            uses_urgent=uses_urgent,
        )

    @staticmethod
    def _candidate_to_out(c: RecipeCandidate) -> RecipeOut:
        return RecipeOut(
            id=c.recipe_id,
            name=c.name,
            cuisine=c.cuisine,
            instructions=c.instructions,
            image_url=c.image_url,
            cook_minutes=c.cook_minutes,
            origin=c.origin,
            ingredients=[
                RecipeIngredientOut(
                    name=i.name, quantity=i.quantity, unit=i.unit, is_essential=i.is_essential
                )
                for i in c.ingredients
            ],
        )

    # ── "made it" → auto-deduct (PLAN §6-4) ──────────────────────────────────
    def mark_made(self, *, user_id: int, recipe: RecipeOut) -> ConsumptionResult:
        """Deduct a recipe's ingredients from stock.

        Seed recipes (with an id) deduct from `recipe_ingredients` deterministically.
        LLM recipes (id is None) are persisted first so future deductions are stable.
        """
        db_recipe = None
        if recipe.id is not None:
            db_recipe = (
                self.db.query(Recipe)
                .options(
                    selectinload(Recipe.ingredients).selectinload(RecipeIngredient.ingredient)
                )
                .filter(Recipe.id == recipe.id)
                .first()
            )
        if db_recipe is None:
            db_recipe = self.persist_recipe(recipe)

        out: list[ConsumptionResultItem] = []
        for ri in db_recipe.ingredients:
            ingredient = ri.ingredient
            if not ingredient:
                continue
            qty = ri.quantity or 1.0
            item, applied = self.inventory.consume(
                user_id=user_id,
                ingredient=ingredient,
                quantity=qty,
                unit=ri.unit,
                source=Source.RECIPE.value,
                ref_type="recipe",
                ref_id=db_recipe.id,
                raw_input=f"[레시피] {db_recipe.name}",
            )
            out.append(
                ConsumptionResultItem(
                    ingredient=ingredient.canonical_name,
                    quantity=qty,
                    unit=ri.unit,
                    matched_item_id=item.id if item else None,
                    applied=applied,
                    note=None if applied else "재고에 없어 차감하지 못했어요",
                )
            )
        self.db.commit()
        return ConsumptionResult(deltas=out, raw_input=db_recipe.name)

    def persist_recipe(self, recipe: RecipeOut) -> Recipe:
        """Persist an (LLM) recipe + its ingredients, resolving canonical names."""
        existing = (
            self.db.query(Recipe)
            .filter(Recipe.name == recipe.name, Recipe.origin == "llm")
            .first()
        )
        if existing:
            return existing

        db_recipe = Recipe(
            name=recipe.name,
            cuisine=recipe.cuisine,
            instructions=recipe.instructions,
            image_url=recipe.image_url,
            cook_minutes=recipe.cook_minutes,
            origin=recipe.origin or "llm",
        )
        self.db.add(db_recipe)
        self.db.flush()
        for ing in recipe.ingredients:
            ingredient = self.normalizer.resolve(self.db, ing.name)
            self.db.add(
                RecipeIngredient(
                    recipe_id=db_recipe.id,
                    ingredient_id=ingredient.id,
                    quantity=ing.quantity,
                    unit=ing.unit,
                    is_essential=ing.is_essential,
                )
            )
        self.db.flush()
        self.db.refresh(db_recipe)
        return db_recipe

    def list_recipes(self) -> list[RecipeOut]:
        recipes = (
            self.db.query(Recipe)
            .options(
                selectinload(Recipe.ingredients).selectinload(RecipeIngredient.ingredient)
            )
            .order_by(Recipe.id.asc())
            .all()
        )
        return [self._db_recipe_to_out(r) for r in recipes]

    @staticmethod
    def _db_recipe_to_out(r: Recipe) -> RecipeOut:
        return RecipeOut(
            id=r.id,
            name=r.name,
            cuisine=r.cuisine,
            instructions=r.instructions,
            image_url=r.image_url,
            cook_minutes=r.cook_minutes,
            origin=r.origin,
            ingredients=[
                RecipeIngredientOut(
                    ingredient_id=ri.ingredient_id,
                    name=ri.ingredient.canonical_name if ri.ingredient else "",
                    quantity=ri.quantity,
                    unit=ri.unit,
                    is_essential=bool(ri.is_essential),
                )
                for ri in r.ingredients
            ],
        )
