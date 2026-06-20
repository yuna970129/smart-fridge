"""Consumption contracts (natural-language / photo → stock decrements)."""

from __future__ import annotations

from pydantic import BaseModel, Field


class ConsumptionDelta(BaseModel):
    """One ingredient the user consumed. Output of the LLM structured parse."""

    ingredient: str = Field(..., description="Ingredient name, e.g. '계란'")
    quantity: float = Field(1.0, description="Amount consumed")
    unit: str | None = None


class ConsumptionRequest(BaseModel):
    """Free-form consumption input from voice or text.

    e.g. "방금 라면에 계란 넣어 먹었어"
    """

    text: str = Field(..., description="Natural-language consumption utterance")
    source: str = Field("voice", description="voice | manual")


class ConsumptionResultItem(BaseModel):
    ingredient: str
    quantity: float
    unit: str | None = None
    matched_item_id: int | None = None
    applied: bool = True
    note: str | None = None


class ConsumptionResult(BaseModel):
    deltas: list[ConsumptionResultItem] = Field(default_factory=list)
    clarification: str | None = Field(
        None, description="A follow-up question if the input was ambiguous"
    )
    raw_input: str | None = None
