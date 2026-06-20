"""Clock helpers — single source of truth for "now" / "today".

Centralising this makes expiry/urgency logic deterministic and testable, and
lets a demo pin the date if needed.
"""

from __future__ import annotations

from datetime import UTC, date, datetime


def now() -> datetime:
    return datetime.now(UTC)


def today() -> date:
    return now().date()


def iso(dt: datetime | date | None) -> str | None:
    return dt.isoformat() if dt is not None else None
