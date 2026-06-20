"""냉장고를 부탁해 — FastAPI application entry point."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import api_router
from app.core.config import settings
from app.core.database import SessionLocal, init_db
from app.core.logging import get_logger, setup_logging
from app.providers.llm import get_llm_provider
from app.seed import run_seed

setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    db = SessionLocal()
    try:
        run_seed(db)
    finally:
        db.close()
    logger.info(
        "Providers — llm=%s receipt=%s recipe=%s (azure configured: %s)",
        get_llm_provider().name,
        settings.receipt_parser,
        settings.recipe_source,
        settings.azure_openai_configured,
    )
    yield


app = FastAPI(
    title="냉장고를 부탁해 API",
    description="냉장고 재고 관리 + 한식 레시피 추천 (self-correcting inventory).",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

import os  # noqa: E402

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/health", tags=["meta"])
def health():
    return {
        "status": "ok",
        "llm_provider": get_llm_provider().name,
        "azure_configured": settings.azure_openai_configured,
        "receipt_parser": settings.receipt_parser,
        "recipe_source": settings.recipe_source,
    }


@app.get("/", tags=["meta"])
def root():
    return {"app": "냉장고를 부탁해", "docs": "/docs", "api": "/api"}
