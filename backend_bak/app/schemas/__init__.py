"""Pydantic schemas (DTOs and provider contracts).

These types are the stable contract between layers:
- Providers (LLM / receipt / recipe) return these regardless of vendor.
- API routers serialize these to the React client.
"""

from app.schemas.consumption import (
    ConsumptionDelta,
    ConsumptionRequest,
    ConsumptionResult,
    ConsumptionResultItem,
)
from app.schemas.inventory import (
    InventoryItemOut,
    InventoryItemUpdate,
    ManualItemCreate,
)
from app.schemas.receipt import ReceiptLineItem, ReceiptParseResult
from app.schemas.recipe import (
    RecipeCandidate,
    RecipeCandidateIngredient,
    RecipeIngredientOut,
    RecipeMatch,
    RecipeOut,
    RecommendationResponse,
    ShoppingListItem,
)
from app.schemas.report import WasteSavingReport

__all__ = [
    "ConsumptionDelta",
    "ConsumptionRequest",
    "ConsumptionResult",
    "ConsumptionResultItem",
    "InventoryItemOut",
    "InventoryItemUpdate",
    "ManualItemCreate",
    "ReceiptLineItem",
    "ReceiptParseResult",
    "RecipeCandidate",
    "RecipeCandidateIngredient",
    "RecipeIngredientOut",
    "RecipeMatch",
    "RecipeOut",
    "RecommendationResponse",
    "ShoppingListItem",
    "WasteSavingReport",
]
