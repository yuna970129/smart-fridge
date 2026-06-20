"""Idempotent seed loader — populates ingredients, aliases, and recipes."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.models import Ingredient, IngredientAlias, Recipe, RecipeIngredient
from app.seed.data import INGREDIENTS, RECIPES

logger = get_logger(__name__)


def _get_or_create_ingredient(db: Session, name: str) -> Ingredient:
    ing = db.query(Ingredient).filter(Ingredient.canonical_name == name).first()
    if not ing:
        alias = db.query(IngredientAlias).filter(IngredientAlias.alias == name).first()
        if alias:
            return alias.ingredient
    if not ing:
        ing = Ingredient(canonical_name=name)
        db.add(ing)
        db.flush()
    return ing


def seed_ingredients(db: Session) -> None:
    for canonical, category, unit, shelf, price, aliases in INGREDIENTS:
        ing = db.query(Ingredient).filter(Ingredient.canonical_name == canonical).first()
        if not ing:
            ing = Ingredient(canonical_name=canonical)
            db.add(ing)
            db.flush()
        ing.category = category
        ing.default_unit = unit
        ing.default_shelf_life_days = shelf
        ing.avg_price = price
        for alias in aliases:
            exists = (
                db.query(IngredientAlias)
                .filter(IngredientAlias.alias == alias)
                .first()
            )
            if not exists:
                db.add(IngredientAlias(ingredient_id=ing.id, alias=alias))
    db.flush()


def seed_recipes(db: Session) -> None:
    for name, cuisine, minutes, instructions, ingredients in RECIPES:
        existing = (
            db.query(Recipe)
            .filter(Recipe.name == name, Recipe.origin == "seed")
            .first()
        )
        if existing:
            continue
        recipe = Recipe(
            name=name,
            cuisine=cuisine,
            cook_minutes=minutes,
            instructions=instructions,
            origin="seed",
        )
        db.add(recipe)
        db.flush()
        for ing_name, qty, unit, essential in ingredients:
            ingredient = _get_or_create_ingredient(db, ing_name)
            db.add(
                RecipeIngredient(
                    recipe_id=recipe.id,
                    ingredient_id=ingredient.id,
                    quantity=qty,
                    unit=unit,
                    is_essential=essential,
                )
            )
    db.flush()


def run_seed(db: Session) -> None:
    seed_ingredients(db)
    seed_recipes(db)
    db.commit()
    n_ing = db.query(Ingredient).count()
    n_rec = db.query(Recipe).count()
    logger.info("Seed complete: %d ingredients, %d recipes", n_ing, n_rec)
