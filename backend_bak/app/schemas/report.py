"""Report DTOs."""

from __future__ import annotations

from pydantic import BaseModel, Field


class WasteSavingReport(BaseModel):
    saved: int = Field(0, description="₩ value actually eaten (consume events)")
    wasted: int = Field(0, description="₩ value thrown away (discard/expire events)")
    consumed_count: int = 0
    wasted_count: int = 0
    period_days: int = 7
    items_wasted: list[str] = Field(default_factory=list)
    items_saved: list[str] = Field(default_factory=list)
