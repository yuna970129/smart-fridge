"""Recipe source abstraction — the feature seam for recommendations.

PLAN.kr.md wants LLM-generated recipes as the primary driver, while keeping
curated seed-DB recipes viable for deterministic "made it → auto-deduct" demos.
Both are modeled as a `RecipeSource` returning vendor-neutral `RecipeCandidate`s:

    seed_db : curated recipes from the DB   (deterministic deduction)
    llm_gen : LLM-generated recipes         (variety, primary)
    hybrid  : seed_db first, top up w/ LLM   (default)

The recommendation service scores whatever candidates come back against live
inventory, so adding/removing a source never touches scoring or the API.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from sqlalchemy.orm import Session

from app.schemas.recipe import RecipeCandidate


class RecipeSource(ABC):
    name: str = "base"

    @abstractmethod
    def suggest(
        self,
        *,
        db: Session,
        available: list[str],
        urgent: list[str],
        k: int = 10,
    ) -> list[RecipeCandidate]:
        """Propose up to ~k recipe candidates given the user's ingredients.

        `db` is passed to every source for a uniform signature; sources that do
        not need it (e.g. the LLM generator) simply ignore it.
        """
