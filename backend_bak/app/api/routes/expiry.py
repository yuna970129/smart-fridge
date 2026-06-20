"""Expiry routes — alerts (§6-5), "still have it?" confirm, auto-expire (§6-6)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user_id, get_expiry_service
from app.schemas.inventory import InventoryItemOut

router = APIRouter(prefix="/expiry", tags=["expiry"])


@router.get("/alerts", response_model=list[InventoryItemOut])
def alerts(
    user_id: int = Depends(get_current_user_id),
    service=Depends(get_expiry_service),
):
    """Items expiring soon / overdue — feeds the notification panel."""
    return service.expiring_soon(user_id=user_id)


@router.post("/confirm/{item_id}", response_model=InventoryItemOut)
def confirm(
    item_id: int,
    still_have: bool,
    user_id: int = Depends(get_current_user_id),
    service=Depends(get_expiry_service),
):
    """'아직 있어요?' → still_have=true keeps it, false consumes it."""
    out = service.confirm(user_id=user_id, item_id=item_id, still_have=still_have)
    if out is None:
        raise HTTPException(404, "Item not found")
    return out


@router.post("/auto-expire", response_model=list[InventoryItemOut])
def auto_expire(
    user_id: int = Depends(get_current_user_id),
    service=Depends(get_expiry_service),
):
    """Sweep overdue items to expired (called on page load / by a scheduler)."""
    return service.auto_expire(user_id=user_id)
