"""FastAPI dependencies — wire request-scoped services with singleton providers."""

from __future__ import annotations

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import User
from app.providers.llm import get_llm_provider
from app.services import (
    ConsumptionService,
    ExpiryService,
    IngredientNormalizer,
    InventoryService,
    RecipeService,
    ReportService,
)

DEMO_USER_NAME = "데모유저"


def get_current_user_id(db: Session = Depends(get_db)) -> int:
    """Single-user demo: get-or-create user #1 (schema is multi-user ready)."""
    user = db.query(User).order_by(User.id.asc()).first()
    if not user:
        user = User(name=DEMO_USER_NAME)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user.id


def get_normalizer() -> IngredientNormalizer:
    return IngredientNormalizer(get_llm_provider())


def get_inventory_service(db: Session = Depends(get_db)) -> InventoryService:
    return InventoryService(db)


def get_receipt_service(
    db: Session = Depends(get_db),
    normalizer: IngredientNormalizer = Depends(get_normalizer),
):
    from app.services.receipt_service import ReceiptService

    return ReceiptService(db, normalizer)


def get_consumption_service(
    db: Session = Depends(get_db),
    normalizer: IngredientNormalizer = Depends(get_normalizer),
) -> ConsumptionService:
    return ConsumptionService(db, get_llm_provider(), normalizer)


def get_recipe_service(
    db: Session = Depends(get_db),
    normalizer: IngredientNormalizer = Depends(get_normalizer),
) -> RecipeService:
    return RecipeService(db, normalizer)


def get_report_service(db: Session = Depends(get_db)) -> ReportService:
    return ReportService(db)


def get_expiry_service(db: Session = Depends(get_db)) -> ExpiryService:
    return ExpiryService(db)
