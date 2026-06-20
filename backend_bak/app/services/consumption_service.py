"""Consumption service — natural-language / photo → stock decrements (PLAN §6-2).

The caching-free catch-all that is PLAN.kr.md's real differentiator: free-form
"라면에 계란 넣어 먹었어" or a food photo, turned into deductions.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.models.enums import Source
from app.providers.llm import LLMError, LLMProvider
from app.schemas.consumption import ConsumptionResult, ConsumptionResultItem
from app.services.inventory_service import InventoryService
from app.services.normalization import IngredientNormalizer

logger = get_logger(__name__)

_TEXT_SYSTEM = """너는 사용자가 먹은 것을 분석해 재고에서 차감할 항목을 뽑는다.
사용자의 자연어 입력에서 '소비된 식재료'와 수량을 추정한다. 모호하면 1로 추정한다.
반드시 JSON 객체만 출력한다:
{
  "deltas": [{"ingredient": string, "quantity": number, "unit": string|null}],
  "clarification": string|null
}
정말 무엇을 먹었는지 알 수 없을 때만 clarification 에 되물을 질문을 넣는다."""

_PHOTO_SYSTEM = """너는 음식 사진을 보고 요리명과 사용된 주요 식재료를 추정한다.
반드시 JSON 객체만 출력한다:
{
  "dish": string,
  "ingredients": [{"ingredient": string, "quantity": number, "unit": string|null}]
}"""


class ConsumptionService:
    def __init__(self, db: Session, llm: LLMProvider, normalizer: IngredientNormalizer) -> None:
        self.db = db
        self.llm = llm
        self.normalizer = normalizer
        self.inventory = InventoryService(db)

    def from_text(self, *, user_id: int, text: str, source: str = Source.VOICE.value) -> ConsumptionResult:
        try:
            data = self.llm.complete_json(
                system=_TEXT_SYSTEM, user=text, task="consumption_parse"
            )
        except LLMError:
            logger.exception("Consumption parse failed")
            return ConsumptionResult(deltas=[], clarification="입력을 처리하지 못했어요. 다시 시도해 주세요.", raw_input=text)

        deltas = data.get("deltas") or []
        clarification = data.get("clarification")
        result = self._apply(user_id=user_id, deltas=deltas, source=source, raw_input=text)
        result.clarification = clarification if not result.deltas else None
        result.raw_input = text
        self.db.commit()
        return result

    def from_photo(self, *, user_id: int, image: bytes) -> ConsumptionResult:
        try:
            data = self.llm.complete_json(
                system=_PHOTO_SYSTEM, user="이 음식 사진을 분석해줘.", images=[image], task="food_photo"
            )
        except LLMError:
            logger.exception("Food photo parse failed")
            return ConsumptionResult(deltas=[], clarification="사진을 분석하지 못했어요.")

        dish = data.get("dish")
        deltas = data.get("ingredients") or []
        result = self._apply(
            user_id=user_id, deltas=deltas, source=Source.PHOTO.value, raw_input=f"[사진] {dish or ''}".strip()
        )
        self.db.commit()
        return result

    def _apply(self, *, user_id: int, deltas: list[dict], source: str, raw_input: str) -> ConsumptionResult:
        out: list[ConsumptionResultItem] = []
        for d in deltas:
            name = str(d.get("ingredient", "")).strip()
            if not name:
                continue
            qty = _as_float(d.get("quantity")) or 1.0
            unit = d.get("unit")
            try:
                ingredient = self.normalizer.resolve(self.db, name)
            except ValueError:
                continue
            item, applied = self.inventory.consume(
                user_id=user_id,
                ingredient=ingredient,
                quantity=qty,
                unit=unit,
                source=source,
                raw_input=raw_input,
            )
            out.append(
                ConsumptionResultItem(
                    ingredient=ingredient.canonical_name,
                    quantity=qty,
                    unit=unit or (item.unit if item else None),
                    matched_item_id=item.id if item else None,
                    applied=applied,
                    note=None if applied else "재고에 없어 기록만 했어요",
                )
            )
        return ConsumptionResult(deltas=out)


def _as_float(v) -> float | None:
    try:
        return float(v) if v is not None else None
    except (TypeError, ValueError):
        return None
