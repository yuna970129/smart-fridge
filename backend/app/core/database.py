"""Database engine, session factory, and FastAPI dependency.

SQLite for the hackathon (zero setup). The `DATABASE_URL` is the only thing
that needs to change to migrate to PostgreSQL in production.
"""

from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    pass


def _engine_kwargs(url: str) -> dict:
    # check_same_thread is a SQLite-only flag required for FastAPI's threadpool.
    if url.startswith("sqlite"):
        return {"connect_args": {"check_same_thread": False}}
    return {"pool_pre_ping": True}


engine = create_engine(settings.database_url, **_engine_kwargs(settings.database_url))
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables. Imports models so they register on Base.metadata."""
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
