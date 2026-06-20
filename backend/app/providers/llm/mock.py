"""Offline mock `LLMProvider`.

Returns deterministic, demo-friendly JSON so the entire app works before Azure
OpenAI credentials are wired in. It switches on the `task` hint and, for
consumption parsing, does lightweight Korean keyword extraction from the user
utterance so the voice/text demo feels real.
"""

from __future__ import annotations

import re
from typing import Any

from app.providers.llm.base import LLMProvider

# Minimal Korean ingredient lexicon for mock consumption parsing.
_KEYWORDS: dict[str, str] = {
    "계란": "개",
    "달걀": "개",
    "라면": "개",
    "우유": "ml",
    "두부": "모",
    "대파": "대",
    "양파": "개",
    "김치": "g",
    "된장": "g",
    "고추장": "g",
    "밥": "공기",
    "돼지고기": "g",
    "소고기": "g",
    "닭고기": "g",
    "마늘": "쪽",
    "감자": "개",
    "당근": "개",
}

_KOR_NUM = {
    "한": 1, "두": 2, "세": 3, "네": 4, "다섯": 5,
    "한개": 1, "두개": 2, "세개": 3,
}


def _extract_quantity(text: str, keyword: str) -> float:
    """Best-effort quantity near a keyword: digits or simple Korean numerals."""
    window = text[max(0, text.find(keyword) - 6) : text.find(keyword) + len(keyword) + 6]
    m = re.search(r"(\d+(?:\.\d+)?)", window)
    if m:
        return float(m.group(1))
    for word, val in _KOR_NUM.items():
        if word in window:
            return float(val)
    return 1.0


class MockLLMProvider(LLMProvider):
    name = "mock"

    def available(self) -> bool:
        return True

    def complete_json(
        self,
        *,
        system: str,
        user: str,
        images: list[bytes] | None = None,
        task: str = "generic",
        temperature: float = 0.2,
    ) -> Any:
        if task == "receipt_parse":
            return self._receipt()
        if task == "consumption_parse":
            return self._consumption(user)
        if task == "food_photo":
            return self._food_photo()
        if task == "recipe_generate":
            return self._recipes(user)
        if task == "normalize_ingredient":
            return self._normalize(user)
        return {}

    # ── canned responses ────────────────────────────────────────────────────
    def _receipt(self) -> dict:
        return {
            "store": "행복마트",
            "purchased_at": None,
            "items": [
                {"name": "햇대파", "quantity": 1, "unit": "단", "price": 2500},
                {"name": "국산두부", "quantity": 1, "unit": "모", "price": 1980},
                {"name": "재래된장", "quantity": 1, "unit": "통", "price": 4500},
                {"name": "특란10구", "quantity": 1, "unit": "판", "price": 3900},
                {"name": "신라면5입", "quantity": 1, "unit": "봉", "price": 3450},
                {"name": "서울우유1L", "quantity": 1, "unit": "개", "price": 2780},
            ],
        }

    def _consumption(self, text: str) -> dict:
        deltas = []
        for kw, unit in _KEYWORDS.items():
            if kw in text:
                deltas.append(
                    {"ingredient": kw, "quantity": _extract_quantity(text, kw), "unit": unit}
                )
        clarification = None
        if not deltas:
            # Unknown input → ask once, like a real assistant would.
            clarification = "무엇을 드셨는지 조금 더 자세히 말씀해 주시겠어요?"
        return {"deltas": deltas, "clarification": clarification}

    def _food_photo(self) -> dict:
        return {
            "dish": "김치찌개",
            "ingredients": [
                {"ingredient": "김치", "quantity": 200, "unit": "g"},
                {"ingredient": "두부", "quantity": 0.5, "unit": "모"},
                {"ingredient": "돼지고기", "quantity": 100, "unit": "g"},
                {"ingredient": "대파", "quantity": 0.5, "unit": "대"},
            ],
        }

    def _recipes(self, user: str) -> dict:
        return {
            "recipes": [
                {
                    "name": "된장찌개",
                    "cuisine": "한식",
                    "cook_minutes": 20,
                    "instructions": "두부와 대파를 썰고 된장을 풀어 끓인다.",
                    "ingredients": [
                        {"name": "된장", "quantity": 30, "unit": "g", "is_essential": True},
                        {"name": "두부", "quantity": 0.5, "unit": "모", "is_essential": True},
                        {"name": "대파", "quantity": 0.5, "unit": "대", "is_essential": True},
                        {"name": "양파", "quantity": 0.5, "unit": "개", "is_essential": False},
                    ],
                },
                {
                    "name": "계란말이",
                    "cuisine": "한식",
                    "cook_minutes": 10,
                    "instructions": "계란을 풀어 대파를 넣고 부친다.",
                    "ingredients": [
                        {"name": "계란", "quantity": 3, "unit": "개", "is_essential": True},
                        {"name": "대파", "quantity": 0.3, "unit": "대", "is_essential": False},
                    ],
                },
            ]
        }

    def _normalize(self, user: str) -> dict:
        # Strip common brand/freshness prefixes as a naive canonicalization.
        cleaned = re.sub(r"(국산|햇|재래|특|신|서울|냉동|유기농)\s*", "", user).strip()
        cleaned = re.sub(r"\d+\s*(L|ml|g|kg|구|입|봉|개|판|단|모|통)$", "", cleaned).strip()
        return {"canonical": cleaned or user, "confidence": 0.5}
