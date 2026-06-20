"""LLM recipe source — generates Korean recipes from the user's ingredients.

This is the primary driver per PLAN.kr.md. It biases generation toward using
urgent (soon-expiring) ingredients so recommendations fight food waste.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.providers.llm import LLMError, LLMProvider
from app.providers.recipe.base import RecipeSource
from app.schemas.recipe import RecipeCandidate, RecipeCandidateIngredient

logger = get_logger(__name__)

_SYSTEM = """너는 한국 가정식 요리사다. 사용자가 가진 재료로 만들 수 있는
'한식 위주' 레시피를 제안한다. 유통기한이 임박한 재료를 우선적으로 활용하라.
반드시 아래 JSON 객체만 출력한다:
{
  "recipes": [
    {
      "name": string,
      "cuisine": "한식",
      "cook_minutes": number,
      "instructions": string,
      "ingredients": [
        {"name": string, "quantity": number, "unit": string, "is_essential": boolean}
      ]
    }
  ]
}
재료 name 은 일반적인 한국어 식재료명(예: 대파, 두부, 계란)으로 쓴다."""


class LlmRecipeSource(RecipeSource):
    name = "llm_gen"

    def __init__(self, llm: LLMProvider) -> None:
        self._llm = llm

    def suggest(
        self,
        *,
        db: Session,
        available: list[str],
        urgent: list[str],
        k: int = 10,
    ) -> list[RecipeCandidate]:
        user = (
            f"보유 재료: {', '.join(available) or '(없음)'}\n"
            f"유통기한 임박(우선 사용): {', '.join(urgent) or '(없음)'}\n"
            f"위 재료로 만들 수 있는 한식 레시피 {k}개를 제안해줘."
        )
        try:
            data = self._llm.complete_json(
                system=_SYSTEM, user=user, task="recipe_generate", temperature=0.6
            )
        except LLMError:
            logger.exception("LLM recipe generation failed")
            return []

        candidates: list[RecipeCandidate] = []
        for r in data.get("recipes") or []:
            name = str(r.get("name", "")).strip()
            if not name:
                continue
            candidates.append(
                RecipeCandidate(
                    name=name,
                    cuisine=r.get("cuisine") or "한식",
                    instructions=r.get("instructions"),
                    cook_minutes=_as_int(r.get("cook_minutes")),
                    origin="llm",
                    recipe_id=None,
                    ingredients=[
                        RecipeCandidateIngredient(
                            name=str(ing.get("name", "")).strip(),
                            quantity=_as_float(ing.get("quantity")),
                            unit=ing.get("unit"),
                            is_essential=bool(ing.get("is_essential", True)),
                        )
                        for ing in (r.get("ingredients") or [])
                        if str(ing.get("name", "")).strip()
                    ],
                )
            )
        return candidates


def _as_int(v) -> int | None:
    try:
        return int(round(float(v))) if v is not None else None
    except (TypeError, ValueError):
        return None


def _as_float(v) -> float | None:
    try:
        return float(v) if v is not None else None
    except (TypeError, ValueError):
        return None
