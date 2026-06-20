"""LLM provider factory — selects the provider from settings with safe fallback.

If `LLM_PROVIDER=azure_openai` but credentials are missing, we transparently
fall back to the mock provider and log a warning, so the demo keeps working.
"""

from __future__ import annotations

from functools import lru_cache

from app.core.config import settings
from app.core.logging import get_logger
from app.providers.llm.azure_openai import AzureOpenAIProvider
from app.providers.llm.base import LLMProvider
from app.providers.llm.mock import MockLLMProvider

logger = get_logger(__name__)


def build_llm_provider() -> LLMProvider:
    choice = settings.llm_provider.lower()
    if choice == "azure_openai":
        provider = AzureOpenAIProvider()
        if provider.available():
            logger.info("Using Azure OpenAI LLM provider")
            return provider
        logger.warning(
            "LLM_PROVIDER=azure_openai but credentials missing; "
            "falling back to mock provider."
        )
        return MockLLMProvider()
    logger.info("Using mock LLM provider")
    return MockLLMProvider()


@lru_cache
def get_llm_provider() -> LLMProvider:
    return build_llm_provider()
