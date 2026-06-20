"""Ingredient normalization — raw receipt/utterance name → canonical Ingredient.

Resolution order (PLAN §6-1 step 2):
    1. exact canonical match
    2. alias match ("뽀로로치즈" → 치즈)
    3. LLM canonicalization fallback, then re-match
    4. create a new ingredient and learn the raw name as an alias

Newly learned aliases make the dictionary self-improving over time.
"""

from __future__ import annotations

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.models import Ingredient, IngredientAlias
from app.providers.llm import LLMError, LLMProvider

logger = get_logger(__name__)

_SYSTEM = """너는 한국 식료품명 정규화기다. 영수증 약어나 브랜드명이 들어오면
일반적인 표준 식재료명으로 바꿔라. 반드시 JSON 객체만 출력한다:
{"canonical": string, "category": string|null, "default_unit": string|null,
 "default_shelf_life_days": number|null}
예: "뽀로로치즈" -> {"canonical":"치즈","category":"유제품","default_unit":"장","default_shelf_life_days":30}"""


class IngredientNormalizer:
    def __init__(self, llm: LLMProvider) -> None:
        self._llm = llm

    def resolve(self, db: Session, raw_name: str, *, learn_alias: bool = True) -> Ingredient:
        name = (raw_name or "").strip()
        if not name:
            raise ValueError("empty ingredient name")

        # 1. exact canonical
        ing = self._by_canonical(db, name)
        if ing:
            return ing

        # 2. alias
        ing = self._by_alias(db, name)
        if ing:
            return ing

        # 3. LLM canonicalization
        canonical, meta = self._llm_canonical(name)
        if canonical and canonical != name:
            ing = self._by_canonical(db, canonical) or self._by_alias(db, canonical)
            if ing:
                if learn_alias:
                    self._add_alias(db, ing, name)
                return ing
        else:
            canonical = canonical or name

        # 4. create new ingredient (+ learn the raw name as alias)
        ing = Ingredient(
            canonical_name=canonical,
            category=meta.get("category"),
            default_unit=meta.get("default_unit"),
            default_shelf_life_days=_as_int(meta.get("default_shelf_life_days")),
        )
        db.add(ing)
        db.flush()
        if learn_alias and name != canonical:
            self._add_alias(db, ing, name)
        return ing

    # ── helpers ─────────────────────────────────────────────────────────────
    def _by_canonical(self, db: Session, name: str) -> Ingredient | None:
        return (
            db.query(Ingredient)
            .filter(func.lower(Ingredient.canonical_name) == name.lower())
            .first()
        )

    def _by_alias(self, db: Session, name: str) -> Ingredient | None:
        alias = (
            db.query(IngredientAlias)
            .filter(func.lower(IngredientAlias.alias) == name.lower())
            .first()
        )
        return alias.ingredient if alias else None

    def _add_alias(self, db: Session, ing: Ingredient, alias_name: str) -> None:
        exists = (
            db.query(IngredientAlias)
            .filter(
                IngredientAlias.ingredient_id == ing.id,
                func.lower(IngredientAlias.alias) == alias_name.lower(),
            )
            .first()
        )
        if not exists:
            db.add(IngredientAlias(ingredient_id=ing.id, alias=alias_name))
            db.flush()

    def _llm_canonical(self, name: str) -> tuple[str | None, dict]:
        try:
            data = self._llm.complete_json(
                system=_SYSTEM, user=name, task="normalize_ingredient"
            )
        except LLMError:
            logger.warning("LLM canonicalization failed for %r", name)
            return None, {}
        return data.get("canonical"), data


def _as_int(v) -> int | None:
    try:
        return int(round(float(v))) if v is not None else None
    except (TypeError, ValueError):
        return None
