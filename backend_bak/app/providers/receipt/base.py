"""Receipt parser abstraction — the feature seam for receipt → structured items.

This is the architectural answer to "are LLM-vision-only and a CLOVA-OCR hybrid
compatible?": **yes**. Both implement `ReceiptParser.parse` and return the same
`ReceiptParseResult`. Swapping or even ensembling them is a settings change:

    llm_vision   : image ──(LLM vision)──▶ JSON
    clova_hybrid : image ──(CLOVA OCR)──▶ text ──(LLM normalize)──▶ JSON

We ship `llm_vision` now; `clova_hybrid` is a documented stub.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from app.schemas.receipt import ReceiptParseResult


class ReceiptParser(ABC):
    name: str = "base"

    @abstractmethod
    def parse(self, image: bytes, *, filename: str | None = None) -> ReceiptParseResult:
        """Parse a receipt image into structured line items."""
