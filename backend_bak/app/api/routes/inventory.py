"""Inventory routes — list / manual add / update / discard."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id, get_normalizer
from app.core.database import get_db
from app.models.enums import EventType, InventoryStatus, Source
from app.schemas.inventory import InventoryItemOut, InventoryItemUpdate, ManualItemCreate
from app.services import IngredientNormalizer, InventoryService

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("", response_model=list[InventoryItemOut])
def list_inventory(
    status: str | None = InventoryStatus.ACTIVE.value,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return InventoryService(db).list_items(user_id, status=status)


@router.post("", response_model=InventoryItemOut, status_code=201)
def add_inventory(
    payload: ManualItemCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
    normalizer: IngredientNormalizer = Depends(get_normalizer),
):
    inv = InventoryService(db)
    ingredient = normalizer.resolve(db, payload.name)
    item = inv.add_stock(
        user_id=user_id,
        ingredient=ingredient,
        quantity=payload.quantity,
        unit=payload.unit,
        purchased_at=payload.purchased_at,
        expires_at=payload.expires_at,
        source=Source.MANUAL.value,
        price=payload.price,
        raw_input=payload.name,
    )
    db.commit()
    return inv.to_out(item)


@router.patch("/{item_id}", response_model=InventoryItemOut)
def update_inventory(
    item_id: int,
    payload: InventoryItemUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    inv = InventoryService(db)
    item = inv.get_item(user_id, item_id)
    if not item:
        raise HTTPException(404, "Item not found")
    inv.adjust_item(
        user_id=user_id,
        item=item,
        quantity=payload.quantity,
        unit=payload.unit,
        expires_at=payload.expires_at,
        status=payload.status,
    )
    db.commit()
    return inv.to_out(item)


@router.delete("/{item_id}", response_model=InventoryItemOut)
def discard_inventory(
    item_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    inv = InventoryService(db)
    item = inv.get_item(user_id, item_id)
    if not item:
        raise HTTPException(404, "Item not found")
    inv.set_status(
        user_id=user_id,
        item=item,
        status=InventoryStatus.DISCARDED,
        event_type=EventType.DISCARD,
        source=Source.MANUAL.value,
    )
    db.commit()
    return inv.to_out(item)
