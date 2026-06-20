"""Consumption routes — natural-language / photo catch-all (PLAN §6-2)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, UploadFile

from app.api.deps import get_consumption_service, get_current_user_id
from app.schemas.consumption import ConsumptionRequest, ConsumptionResult

router = APIRouter(prefix="/consumption", tags=["consumption"])


@router.post("/text", response_model=ConsumptionResult)
def consume_text(
    payload: ConsumptionRequest,
    user_id: int = Depends(get_current_user_id),
    service=Depends(get_consumption_service),
):
    return service.from_text(user_id=user_id, text=payload.text, source=payload.source)


@router.post("/photo", response_model=ConsumptionResult)
async def consume_photo(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id),
    service=Depends(get_consumption_service),
):
    image = await file.read()
    return service.from_photo(user_id=user_id, image=image)
