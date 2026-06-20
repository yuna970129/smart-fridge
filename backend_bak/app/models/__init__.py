"""ORM models — schema mirrors PLAN.kr.md §5-2.

Design philosophy (PLAN §5-1):
- `InventoryItem` = current stock (a fast-read projection of events).
- `InventoryEvent` = append-only log of every change = the substance of the
  "self-correcting estimate" and the source of the waste/saving report.
- `Ingredient` + `IngredientAlias` = normalization dictionary.
- `RecipeIngredient` = the data behind "made it → auto-deduct".
"""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.clock import now
from app.core.database import Base
from app.models.enums import InventoryStatus


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str | None] = mapped_column(String(120))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class Ingredient(Base):
    """Food master / normalization dictionary entry."""

    __tablename__ = "ingredients"

    id: Mapped[int] = mapped_column(primary_key=True)
    canonical_name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    category: Mapped[str | None] = mapped_column(String(60))
    default_unit: Mapped[str | None] = mapped_column(String(20))
    default_shelf_life_days: Mapped[int | None] = mapped_column(Integer)
    avg_price: Mapped[int | None] = mapped_column(Integer)

    aliases: Mapped[list[IngredientAlias]] = relationship(
        back_populates="ingredient", cascade="all, delete-orphan"
    )


class IngredientAlias(Base):
    """Receipt abbreviation / brand name → canonical mapping.

    e.g. "뽀로로치즈" → 치즈, "햇대파" → 대파.
    """

    __tablename__ = "ingredient_aliases"

    id: Mapped[int] = mapped_column(primary_key=True)
    ingredient_id: Mapped[int] = mapped_column(ForeignKey("ingredients.id"), index=True)
    alias: Mapped[str] = mapped_column(String(120), index=True)

    ingredient: Mapped[Ingredient] = relationship(back_populates="aliases")


class InventoryItem(Base):
    """Current stock — a projection of events for fast reads."""

    __tablename__ = "inventory_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    ingredient_id: Mapped[int] = mapped_column(ForeignKey("ingredients.id"), index=True)
    quantity: Mapped[float] = mapped_column(Float, default=0.0)
    unit: Mapped[str | None] = mapped_column(String(20))
    purchased_at: Mapped[date | None] = mapped_column(Date)
    expires_at: Mapped[date | None] = mapped_column(Date, index=True)
    status: Mapped[str] = mapped_column(
        String(20), default=InventoryStatus.ACTIVE.value, index=True
    )
    source: Mapped[str | None] = mapped_column(String(20))
    last_confirmed_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=now, onupdate=now)

    ingredient: Mapped[Ingredient] = relationship()


class InventoryEvent(Base):
    """Append-only log of every stock change (self-correcting + reports). ⭐"""

    __tablename__ = "inventory_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    inventory_item_id: Mapped[int | None] = mapped_column(
        ForeignKey("inventory_items.id")
    )
    ingredient_id: Mapped[int | None] = mapped_column(ForeignKey("ingredients.id"))
    event_type: Mapped[str] = mapped_column(String(20), index=True)
    quantity_delta: Mapped[float] = mapped_column(Float, default=0.0)
    unit: Mapped[str | None] = mapped_column(String(20))
    source: Mapped[str | None] = mapped_column(String(20))
    ref_type: Mapped[str | None] = mapped_column(String(20))
    ref_id: Mapped[int | None] = mapped_column(Integer)
    raw_input: Mapped[str | None] = mapped_column(Text)
    est_value: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now, index=True)

    ingredient: Mapped[Ingredient | None] = relationship()


class Recipe(Base):
    __tablename__ = "recipes"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160), index=True)
    cuisine: Mapped[str | None] = mapped_column(String(40))
    instructions: Mapped[str | None] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(String(500))
    cook_minutes: Mapped[int | None] = mapped_column(Integer)
    origin: Mapped[str] = mapped_column(String(10), default="seed")

    ingredients: Mapped[list[RecipeIngredient]] = relationship(
        back_populates="recipe", cascade="all, delete-orphan"
    )


class RecipeIngredient(Base):
    """Basis for "made it" → auto-deduction."""

    __tablename__ = "recipe_ingredients"

    id: Mapped[int] = mapped_column(primary_key=True)
    recipe_id: Mapped[int] = mapped_column(ForeignKey("recipes.id"), index=True)
    ingredient_id: Mapped[int] = mapped_column(ForeignKey("ingredients.id"), index=True)
    quantity: Mapped[float | None] = mapped_column(Float)
    unit: Mapped[str | None] = mapped_column(String(20))
    is_essential: Mapped[bool] = mapped_column(Boolean, default=True)

    recipe: Mapped[Recipe] = relationship(back_populates="ingredients")
    ingredient: Mapped[Ingredient] = relationship()


class Receipt(Base):
    """Raw receipt record for audit / reprocessing (optional)."""

    __tablename__ = "receipts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    image_path: Mapped[str | None] = mapped_column(String(500))
    raw_json: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
