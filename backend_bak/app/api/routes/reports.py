"""Report routes — waste/saving summary (PLAN §5-3)."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user_id, get_report_service
from app.core.constants import REPORT_PERIOD_DAYS
from app.schemas.report import WasteSavingReport

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/waste-saving", response_model=WasteSavingReport)
def waste_saving(
    period_days: int = REPORT_PERIOD_DAYS,
    user_id: int = Depends(get_current_user_id),
    service=Depends(get_report_service),
):
    return service.waste_saving(user_id=user_id, period_days=period_days)
