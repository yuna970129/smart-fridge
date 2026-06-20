"""Report service — waste/saving aggregation from the event log (PLAN §5-3)."""

from __future__ import annotations

from datetime import timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.clock import now
from app.core.constants import REPORT_PERIOD_DAYS
from app.models import Ingredient, InventoryEvent
from app.models.enums import EventType
from app.schemas.report import WasteSavingReport


class ReportService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def waste_saving(self, *, user_id: int, period_days: int = REPORT_PERIOD_DAYS) -> WasteSavingReport:
        since = now() - timedelta(days=period_days)
        rows = (
            self.db.query(
                InventoryEvent.event_type,
                func.coalesce(func.sum(InventoryEvent.est_value), 0),
                func.count(InventoryEvent.id),
            )
            .filter(InventoryEvent.user_id == user_id, InventoryEvent.created_at >= since)
            .group_by(InventoryEvent.event_type)
            .all()
        )

        saved = wasted = consumed_count = wasted_count = 0
        for event_type, value, count in rows:
            if event_type == EventType.CONSUME.value:
                saved += int(value or 0)
                consumed_count += int(count or 0)
            elif event_type in (EventType.DISCARD.value, EventType.EXPIRE.value):
                wasted += int(value or 0)
                wasted_count += int(count or 0)

        return WasteSavingReport(
            saved=saved,
            wasted=wasted,
            consumed_count=consumed_count,
            wasted_count=wasted_count,
            period_days=period_days,
            items_saved=self._names(user_id, since, [EventType.CONSUME.value]),
            items_wasted=self._names(
                user_id, since, [EventType.DISCARD.value, EventType.EXPIRE.value]
            ),
        )

    def _names(self, user_id: int, since, event_types: list[str]) -> list[str]:
        rows = (
            self.db.query(Ingredient.canonical_name)
            .join(InventoryEvent, InventoryEvent.ingredient_id == Ingredient.id)
            .filter(
                InventoryEvent.user_id == user_id,
                InventoryEvent.created_at >= since,
                InventoryEvent.event_type.in_(event_types),
            )
            .distinct()
            .all()
        )
        return [r[0] for r in rows if r[0]]
