"""Seed-DB recipe source — curated recipes for deterministic recommendations."""

from __future__ import annotations

from sqlalchemy.orm import Session, selectinload

from app.models import Recipe, RecipeIngredient
from app.providers.recipe.base import RecipeSource
from app.schemas.recipe import RecipeCandidate, RecipeCandidateIngredient


class SeedDbRecipeSource(RecipeSource):
    name = "seed_db"

    def suggest(
        self,
        *,
        db: Session,
        available: list[str],
        urgent: list[str],
        k: int = 10,
    ) -> list[RecipeCandidate]:
        # Return all curated recipes as candidates; scoring happens downstream.
        recipes = (
            db.query(Recipe)
            .options(
                selectinload(Recipe.ingredients).selectinload(
                    RecipeIngredient.ingredient
                )
            )
            .all()
        )
        candidates: list[RecipeCandidate] = []
        for r in recipes:
            candidates.append(
                RecipeCandidate(
                    name=r.name,
                    cuisine=r.cuisine,
                    instructions=r.instructions,
                    image_url=r.image_url,
                    cook_minutes=r.cook_minutes,
                    origin="seed",
                    recipe_id=r.id,
                    ingredients=[
                        RecipeCandidateIngredient(
                            name=ri.ingredient.canonical_name if ri.ingredient else "",
                            quantity=ri.quantity,
                            unit=ri.unit,
                            is_essential=bool(ri.is_essential),
                        )
                        for ri in r.ingredients
                        if ri.ingredient
                    ],
                )
            )
        return candidates
