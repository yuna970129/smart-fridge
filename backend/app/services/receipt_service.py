"""Receipt service — orchestrates parse → normalize → add stock (PLAN §6-1)."""

from __future__ import annotations

import json
import os
import uuid

from sqlalchemy.orm import Session

from app.core.clock import now
from app.core.logging import get_logger
from app.models import Receipt
from app.models.enums import Source
from app.providers.receipt import get_receipt_parser
from app.schemas.inventory import InventoryItemOut
from app.schemas.receipt import ReceiptParseResult
from app.services.inventory_service import InventoryService
from app.services.normalization import IngredientNormalizer

logger = get_logger(__name__)

UPLOAD_DIR = "uploads"


class ReceiptService:
    def __init__(self, db: Session, normalizer: IngredientNormalizer) -> None:
        self.db = db
        self.normalizer = normalizer
        self.inventory = InventoryService(db)
        self.parser = get_receipt_parser()

    def process(
        self, *, user_id: int, image: bytes, filename: str | None
    ) -> tuple[ReceiptParseResult, list[InventoryItemOut]]:
        parsed = self.parser.parse(image, filename=filename)
        image_path = self._save_image(image, filename)

        receipt = Receipt(
            user_id=user_id,
            image_path=image_path,
            raw_json=json.dumps(parsed.model_dump(), ensure_ascii=False),
        )
        self.db.add(receipt)
        self.db.flush()

        added: list[InventoryItemOut] = []
        for line in parsed.items:
            try:
                ingredient = self.normalizer.resolve(self.db, line.name)
            except ValueError:
                continue
            item = self.inventory.add_stock(
                user_id=user_id,
                ingredient=ingredient,
                quantity=line.quantity or 1,
                unit=line.unit,
                source=Source.RECEIPT.value,
                price=line.price,
                raw_input=line.name,
            )
            added.append(self.inventory.to_out(item))

        self.db.commit()
        return parsed, added

    def _save_image(self, image: bytes, filename: str | None) -> str:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        ext = os.path.splitext(filename or "")[1] or ".jpg"
        path = os.path.join(UPLOAD_DIR, f"{now():%Y%m%d}_{uuid.uuid4().hex[:8]}{ext}")
        try:
            with open(path, "wb") as f:
                f.write(image)
        except OSError:
            logger.warning("Failed to persist receipt image")
            return ""
        return path
