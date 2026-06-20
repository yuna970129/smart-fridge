"""Inventory service — the self-correcting estimate engine (PLAN §5-1).

Maintains `inventory_items` (fast-read projection) while writing every change to
the append-only `inventory_events` log, which powers both self-correction and
the waste/saving report.
"""

from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.core.clock import now, today
from app.core.constants import FALLBACK_SHELF_LIFE_DAYS, URGENCY_WINDOW_DAYS
from app.models import Ingredient, InventoryEvent, InventoryItem
from app.models.enums import EventType, InventoryStatus, Source
from app.schemas.inventory import InventoryItemOut


class InventoryService:
    def __init__(self, db: Session) -> None:
        self.db = db

    # ── reads ────────────────────────────────────────────────────────────────
    def list_items(
        self, user_id: int, status: str | None = InventoryStatus.ACTIVE.value
    ) -> list[InventoryItemOut]:
        q = self.db.query(InventoryItem).filter(InventoryItem.user_id == user_id)
        if status:
            q = q.filter(InventoryItem.status == status)
        items = q.order_by(InventoryItem.expires_at.is_(None), InventoryItem.expires_at.asc()).all()
        return [self.to_out(i) for i in items]

    def get_item(self, user_id: int, item_id: int) -> InventoryItem | None:
        return (
            self.db.query(InventoryItem)
            .filter(InventoryItem.id == item_id, InventoryItem.user_id == user_id)
            .first()
        )

    def to_out(self, item: InventoryItem) -> InventoryItemOut:
        days_left = (item.expires_at - today()).days if item.expires_at else None
        return InventoryItemOut(
            id=item.id,
            ingredient_id=item.ingredient_id,
            ingredient_name=item.ingredient.canonical_name if item.ingredient else None,
            category=item.ingredient.category if item.ingredient else None,
            quantity=item.quantity,
            unit=item.unit,
            purchased_at=item.purchased_at,
            expires_at=item.expires_at,
            status=item.status,
            source=item.source,
            last_confirmed_at=item.last_confirmed_at,
            days_left=days_left,
            is_urgent=(
                days_left is not None
                and days_left <= URGENCY_WINDOW_DAYS
                and item.status == InventoryStatus.ACTIVE.value
            ),
        )

    # ── writes ───────────────────────────────────────────────────────────────
    def add_stock(
        self,
        *,
        user_id: int,
        ingredient: Ingredient,
        quantity: float,
        unit: str | None = None,
        purchased_at: date | None = None,
        expires_at: date | None = None,
        source: str = Source.MANUAL.value,
        price: int | None = None,
        raw_input: str | None = None,
    ) -> InventoryItem:
        purchased_at = purchased_at or today()
        unit = unit or (ingredient.default_unit or "개")
        expires_at = expires_at or self._estimate_expiry(ingredient, purchased_at)

        # Merge into the existing active lot for this ingredient (projection).
        item = (
            self.db.query(InventoryItem)
            .filter(
                InventoryItem.user_id == user_id,
                InventoryItem.ingredient_id == ingredient.id,
                InventoryItem.status == InventoryStatus.ACTIVE.value,
            )
            .first()
        )
        if item:
            item.quantity += quantity
            item.purchased_at = purchased_at
            # Keep the soonest expiry so we never under-warn.
            if expires_at and (item.expires_at is None or expires_at < item.expires_at):
                item.expires_at = expires_at
            item.source = source
            item.updated_at = now()
        else:
            item = InventoryItem(
                user_id=user_id,
                ingredient_id=ingredient.id,
                quantity=quantity,
                unit=unit,
                purchased_at=purchased_at,
                expires_at=expires_at,
                status=InventoryStatus.ACTIVE.value,
                source=source,
            )
            self.db.add(item)
            self.db.flush()

        self._log(
            user_id=user_id,
            item=item,
            ingredient_id=ingredient.id,
            event_type=EventType.PURCHASE,
            quantity_delta=quantity,
            unit=unit,
            source=source,
            est_value=price if price is not None else self._est_value(ingredient, quantity),
            raw_input=raw_input,
        )
        return item

    def consume(
        self,
        *,
        user_id: int,
        ingredient: Ingredient,
        quantity: float,
        unit: str | None = None,
        source: str = Source.MANUAL.value,
        ref_type: str | None = None,
        ref_id: int | None = None,
        raw_input: str | None = None,
    ) -> tuple[InventoryItem | None, bool]:
        """Decrement stock and log a consume event. Returns (item, applied)."""
        item = (
            self.db.query(InventoryItem)
            .filter(
                InventoryItem.user_id == user_id,
                InventoryItem.ingredient_id == ingredient.id,
                InventoryItem.status == InventoryStatus.ACTIVE.value,
            )
            .first()
        )
        applied = False
        if item:
            item.quantity -= quantity
            if item.quantity <= 0:
                item.quantity = 0
                item.status = InventoryStatus.CONSUMED.value
            item.updated_at = now()
            applied = True

        self._log(
            user_id=user_id,
            item=item,
            ingredient_id=ingredient.id,
            event_type=EventType.CONSUME,
            quantity_delta=-abs(quantity),
            unit=unit or (item.unit if item else None),
            source=source,
            ref_type=ref_type,
            ref_id=ref_id,
            est_value=self._est_value(ingredient, quantity),
            raw_input=raw_input,
        )
        return item, applied

    def set_status(
        self,
        *,
        user_id: int,
        item: InventoryItem,
        status: InventoryStatus,
        event_type: EventType,
        source: str = Source.SYSTEM.value,
    ) -> None:
        remaining = item.quantity
        item.status = status.value
        item.updated_at = now()
        self._log(
            user_id=user_id,
            item=item,
            ingredient_id=item.ingredient_id,
            event_type=event_type,
            quantity_delta=-abs(remaining),
            unit=item.unit,
            source=source,
            est_value=self._est_value(item.ingredient, remaining) if item.ingredient else None,
        )

    def adjust_item(
        self,
        *,
        user_id: int,
        item: InventoryItem,
        quantity: float | None,
        unit: str | None,
        expires_at: date | None,
        status: str | None,
    ) -> InventoryItem:
        if quantity is not None:
            delta = quantity - item.quantity
            item.quantity = quantity
            self._log(
                user_id=user_id,
                item=item,
                ingredient_id=item.ingredient_id,
                event_type=EventType.ADJUST,
                quantity_delta=delta,
                unit=unit or item.unit,
                source=Source.MANUAL.value,
            )
        if unit is not None:
            item.unit = unit
        if expires_at is not None:
            item.expires_at = expires_at
        if status is not None:
            item.status = status
        item.updated_at = now()
        return item

    # ── internals ──────────────────────────────────────────────────────────
    def _estimate_expiry(self, ingredient: Ingredient, purchased_at: date) -> date:
        days = ingredient.default_shelf_life_days or FALLBACK_SHELF_LIFE_DAYS
        return purchased_at + timedelta(days=days)

    def _est_value(self, ingredient: Ingredient | None, quantity: float) -> int | None:
        if not ingredient or ingredient.avg_price is None:
            return None
        return int(round(ingredient.avg_price * max(quantity, 0)))

    def _log(
        self,
        *,
        user_id: int,
        item: InventoryItem | None,
        ingredient_id: int | None,
        event_type: EventType,
        quantity_delta: float,
        unit: str | None = None,
        source: str | None = None,
        ref_type: str | None = None,
        ref_id: int | None = None,
        est_value: int | None = None,
        raw_input: str | None = None,
    ) -> InventoryEvent:
        ev = InventoryEvent(
            user_id=user_id,
            inventory_item_id=item.id if item else None,
            ingredient_id=ingredient_id,
            event_type=event_type.value,
            quantity_delta=quantity_delta,
            unit=unit,
            source=source,
            ref_type=ref_type,
            ref_id=ref_id,
            est_value=est_value,
            raw_input=raw_input,
        )
        self.db.add(ev)
        self.db.flush()
        return ev
