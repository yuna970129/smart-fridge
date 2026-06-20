"""CLOVA OCR hybrid receipt parser — DOCUMENTED STUB (not yet implemented).

Why a stub: PLAN.kr.md keeps the hybrid as an open option for higher Korean
receipt accuracy *if the cost is acceptable*. We ship LLM-vision-only, but wire
the seam so enabling the hybrid later is purely additive — no caller changes.

Planned flow when `CLOVA_OCR_*` creds are set:
    1. POST the image to Naver CLOVA OCR (general/receipt-specific endpoint).
    2. Collect recognized text fields + bounding boxes.
    3. Feed that text to the LLM (`task="receipt_parse"`, no image) to normalize
       into the same `ReceiptParseResult` schema.
    4. (Optional) ensemble with LLM-vision output and reconcile quantities.

Because the output type is identical to `LLMVisionReceiptParser`, downstream
code (services, API, frontend) needs zero changes to adopt it.
"""

from __future__ import annotations

from app.core.config import settings
from app.providers.llm import LLMProvider
from app.providers.receipt.base import ReceiptParser
from app.schemas.receipt import ReceiptParseResult


class ClovaHybridReceiptParser(ReceiptParser):
    name = "clova_hybrid"

    def __init__(self, llm: LLMProvider) -> None:
        self._llm = llm

    def _ocr(self, image: bytes) -> list[str]:  # pragma: no cover - not implemented
        if not (settings.clova_ocr_invoke_url and settings.clova_ocr_secret):
            raise NotImplementedError(
                "CLOVA OCR hybrid is not configured. Set CLOVA_OCR_INVOKE_URL and "
                "CLOVA_OCR_SECRET, then implement _ocr() to call the CLOVA endpoint."
            )
        # Future: httpx POST to CLOVA, return recognized text lines.
        raise NotImplementedError

    def parse(self, image: bytes, *, filename: str | None = None) -> ReceiptParseResult:
        raise NotImplementedError(
            "clova_hybrid receipt parser is a documented extension point and is "
            "not implemented yet. Use RECEIPT_PARSER=llm_vision."
        )
