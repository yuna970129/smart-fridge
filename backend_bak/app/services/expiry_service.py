"""Expiry service — "still have it?" confirmation (§6-5) + auto-expire (§6-6)."""

from __future__ import annotations

from datetime import timedelta

from sqlalchemy.orm import Session

from app.core.clock import now, today
from app.core.constants import CONFIRM_EXTEND_DAYS
from app.models import InventoryItem
from app.models.enums import EventType, InventoryStatus, Source
from app.schemas.inventory import InventoryItemOut
from app.services.inventory_service import InventoryService


class ExpiryService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.inventory = InventoryService(db)

    def expiring_soon(self, *, user_id: int) -> list[InventoryItemOut]:
        """Active items within the urgency window — drives the alert panel."""
        items = self.inventory.list_items(user_id, status=InventoryStatus.ACTIVE.value)
        return [i for i in items if i.is_urgent or (i.days_left is not None and i.days_left < 0)]

    def confirm(self, *, user_id: int, item_id: int, still_have: bool) -> InventoryItemOut | None:
        item = self.inventory.get_item(user_id, item_id)
        if not item:
            return None
        if still_have:
            item.last_confirmed_at = now()
            # Nudge the expiry out a little so we stop nagging immediately.
            if item.expires_at:
                item.expires_at = max(
                    item.expires_at, today() + timedelta(days=CONFIRM_EXTEND_DAYS)
                )
            item.updated_at = now()
            self.db.commit()
            return self.inventory.to_out(item)
        # "다 썼어요" → consume the remainder.
        self.inventory.set_status(
            user_id=user_id,
            item=item,
            status=InventoryStatus.CONSUMED,
            event_type=EventType.CONSUME,
            source=Source.MANUAL.value,
        )
        self.db.commit()
        return self.inventory.to_out(item)

    def auto_expire(self, *, user_id: int) -> list[InventoryItemOut]:
        """Mark overdue active items as expired (self-cleaning, PLAN §6-6)."""
        overdue = (
            self.db.query(InventoryItem)
            .filter(
                InventoryItem.user_id == user_id,
                InventoryItem.status == InventoryStatus.ACTIVE.value,
                InventoryItem.expires_at.is_not(None),
                InventoryItem.expires_at < today(),
            )
            .all()
        )
        expired: list[InventoryItemOut] = []
        for item in overdue:
            self.inventory.set_status(
                user_id=user_id,
                item=item,
                status=InventoryStatus.EXPIRED,
                event_type=EventType.EXPIRE,
                source=Source.SYSTEM.value,
            )
            expired.append(self.inventory.to_out(item))
        if expired:
            self.db.commit()
        return expired
