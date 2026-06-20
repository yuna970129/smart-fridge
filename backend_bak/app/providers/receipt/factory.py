"""Receipt parser factory."""

from __future__ import annotations

from functools import lru_cache

from app.core.config import settings
from app.core.logging import get_logger
from app.providers.llm import get_llm_provider
from app.providers.receipt.base import ReceiptParser
from app.providers.receipt.clova import ClovaHybridReceiptParser
from app.providers.receipt.llm_vision import LLMVisionReceiptParser

logger = get_logger(__name__)


def build_receipt_parser() -> ReceiptParser:
    llm = get_llm_provider()
    choice = settings.receipt_parser.lower()
    if choice == "clova_hybrid":
        logger.info("Using CLOVA hybrid receipt parser")
        return ClovaHybridReceiptParser(llm)
    logger.info("Using LLM-vision receipt parser")
    return LLMVisionReceiptParser(llm)


@lru_cache
def get_receipt_parser() -> ReceiptParser:
    return build_receipt_parser()
