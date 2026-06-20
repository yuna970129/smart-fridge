"""LLM-vision receipt parser: image → structured JSON in one shot."""

from __future__ import annotations

from app.core.logging import get_logger
from app.providers.llm import LLMError, LLMProvider
from app.providers.receipt.base import ReceiptParser
from app.schemas.receipt import ReceiptLineItem, ReceiptParseResult

logger = get_logger(__name__)

_SYSTEM = """너는 한국 마트 영수증을 읽는 OCR+정규화 도우미다.
영수증 이미지에서 '식료품/식자재' 항목만 골라 JSON으로 구조화하라.
비식품(봉투, 포인트적립, 할인줄 등)은 제외한다.
반드시 아래 형태의 JSON 객체만 출력한다:
{
  "store": string|null,
  "purchased_at": "YYYY-MM-DD"|null,
  "items": [
    {"name": string, "quantity": number, "unit": string|null, "price": number|null}
  ]
}
name 은 영수증에 인쇄된 원문 그대로 둔다(정규화는 이후 단계가 한다)."""

_USER = "이 영수증에서 식자재 항목을 추출해 JSON으로 반환해줘."


class LLMVisionReceiptParser(ReceiptParser):
    name = "llm_vision"

    def __init__(self, llm: LLMProvider) -> None:
        self._llm = llm

    def parse(self, image: bytes, *, filename: str | None = None) -> ReceiptParseResult:
        try:
            data = self._llm.complete_json(
                system=_SYSTEM,
                user=_USER,
                images=[image],
                task="receipt_parse",
            )
        except LLMError:
            logger.exception("LLM vision receipt parse failed")
            return ReceiptParseResult(items=[], parser=self.name)

        items = [
            ReceiptLineItem(
                name=str(it.get("name", "")).strip(),
                quantity=float(it.get("quantity") or 1),
                unit=it.get("unit"),
                price=_as_int(it.get("price")),
            )
            for it in (data.get("items") or [])
            if str(it.get("name", "")).strip()
        ]
        return ReceiptParseResult(
            items=items,
            store=data.get("store"),
            purchased_at=data.get("purchased_at"),
            parser=self.name,
        )


def _as_int(v) -> int | None:
    try:
        return int(round(float(v))) if v is not None else None
    except (TypeError, ValueError):
        return None
