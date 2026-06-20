"""Receipt parsing contracts.

`ReceiptLineItem` is the vendor-neutral output every `ReceiptParser` must
return — whether it used LLM vision alone or a CLOVA-OCR-then-LLM hybrid.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class ReceiptLineItem(BaseModel):
    """One parsed line from a receipt (raw, pre-normalization)."""

    name: str = Field(..., description="Raw item name as printed, e.g. '햇대파'")
    quantity: float = Field(1.0, description="Quantity purchased")
    unit: str | None = Field(None, description="Unit, e.g. 개/대/모/g/ml")
    price: int | None = Field(None, description="Line price in KRW")


class ReceiptParseResult(BaseModel):
    """Full structured result from a receipt parse."""

    items: list[ReceiptLineItem] = Field(default_factory=list)
    store: str | None = None
    purchased_at: str | None = Field(
        None, description="ISO date if detected on the receipt"
    )
    parser: str = Field("llm_vision", description="Which parser produced this")
