"""Aggregate all API routers under a single versioned router."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.routes import (
    consumption,
    expiry,
    inventory,
    receipts,
    recipes,
    reports,
)

api_router = APIRouter(prefix="/api")
api_router.include_router(inventory.router)
api_router.include_router(receipts.router)
api_router.include_router(consumption.router)
api_router.include_router(recipes.router)
api_router.include_router(reports.router)
api_router.include_router(expiry.router)
