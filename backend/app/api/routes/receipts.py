"""Receipt routes — upload an image, parse to stock (PLAN §6-1)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, UploadFile

from app.api.deps import get_current_user_id, get_receipt_service
from app.schemas.inventory import InventoryItemOut
from app.schemas.receipt import ReceiptParseResult

router = APIRouter(prefix="/receipts", tags=["receipts"])


class ReceiptUploadResponse(ReceiptParseResult):
    added_items: list[InventoryItemOut] = []


@router.post("/upload", response_model=ReceiptUploadResponse)
async def upload_receipt(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id),
    service=Depends(get_receipt_service),
):
    image = await file.read()
    parsed, added = service.process(
        user_id=user_id, image=image, filename=file.filename
    )
    return ReceiptUploadResponse(**parsed.model_dump(), added_items=added)
