"""Inventory DTOs."""

from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class InventoryItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ingredient_id: int
    ingredient_name: str | None = None
    category: str | None = None
    quantity: float
    unit: str | None = None
    purchased_at: date | None = None
    expires_at: date | None = None
    status: str
    source: str | None = None
    last_confirmed_at: datetime | None = None
    days_left: int | None = Field(
        None, description="Days until expiry (negative = overdue)"
    )
    is_urgent: bool = Field(False, description="Expiring within the urgency window")


class ManualItemCreate(BaseModel):
    name: str = Field(..., description="Ingredient name (canonical or alias)")
    quantity: float = 1.0
    unit: str | None = None
    purchased_at: date | None = None
    expires_at: date | None = None
    price: int | None = None


class InventoryItemUpdate(BaseModel):
    quantity: float | None = None
    unit: str | None = None
    expires_at: date | None = None
    status: str | None = None
