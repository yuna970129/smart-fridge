"""Recipe source factory."""

from __future__ import annotations

from functools import lru_cache

from app.core.config import settings
from app.core.logging import get_logger
from app.providers.llm import get_llm_provider
from app.providers.recipe.base import RecipeSource
from app.providers.recipe.hybrid import HybridRecipeSource
from app.providers.recipe.llm_gen import LlmRecipeSource
from app.providers.recipe.seed_db import SeedDbRecipeSource

logger = get_logger(__name__)


def build_recipe_source() -> RecipeSource:
    choice = settings.recipe_source.lower()
    llm = get_llm_provider()
    seed_src = SeedDbRecipeSource()
    llm_src = LlmRecipeSource(llm)

    if choice == "seed_db":
        logger.info("Using seed-DB recipe source")
        return seed_src
    if choice == "llm_gen":
        logger.info("Using LLM recipe source")
        return llm_src
    logger.info("Using hybrid recipe source")
    return HybridRecipeSource(seed_src, llm_src)


@lru_cache
def get_recipe_source() -> RecipeSource:
    return build_recipe_source()
