"""Shared domain enums used across models, schemas, and services."""

from __future__ import annotations

from enum import StrEnum


class InventoryStatus(StrEnum):
    ACTIVE = "active"
    CONSUMED = "consumed"
    EXPIRED = "expired"
    DISCARDED = "discarded"


class EventType(StrEnum):
    PURCHASE = "purchase"
    CONSUME = "consume"
    DISCARD = "discard"
    EXPIRE = "expire"
    ADJUST = "adjust"


class Source(StrEnum):
    RECEIPT = "receipt"
    VOICE = "voice"
    PHOTO = "photo"
    RECIPE = "recipe"
    SYSTEM = "system"
    MANUAL = "manual"


class RecipeOrigin(StrEnum):
    SEED = "seed"
    LLM = "llm"
