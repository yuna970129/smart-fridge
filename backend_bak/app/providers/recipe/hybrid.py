"""Hybrid recipe source — seed DB first, topped up with LLM generation.

Default per PLAN.kr.md: curated seed recipes guarantee a deterministic
"made it → auto-deduct" demo, while the LLM adds variety. De-duplicates by name
so a seed recipe always wins over an LLM one with the same name (seed has a
stable `recipe_id` for deterministic deduction).
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.providers.recipe.base import RecipeSource
from app.providers.recipe.llm_gen import LlmRecipeSource
from app.providers.recipe.seed_db import SeedDbRecipeSource
from app.schemas.recipe import RecipeCandidate


class HybridRecipeSource(RecipeSource):
    name = "hybrid"

    def __init__(self, seed: SeedDbRecipeSource, llm: LlmRecipeSource) -> None:
        self._seed = seed
        self._llm = llm

    def suggest(
        self,
        *,
        db: Session,
        available: list[str],
        urgent: list[str],
        k: int = 10,
    ) -> list[RecipeCandidate]:
        seed = self._seed.suggest(db=db, available=available, urgent=urgent, k=k)
        out: list[RecipeCandidate] = list(seed)
        seen = {c.name for c in seed}

        # Only call the LLM to fill remaining slots — keeps cost/latency down.
        remaining = max(0, k - len(out))
        if remaining > 0:
            generated = self._llm.suggest(
                db=db, available=available, urgent=urgent, k=remaining
            )
            for c in generated:
                if c.name not in seen:
                    out.append(c)
                    seen.add(c.name)
        return out
