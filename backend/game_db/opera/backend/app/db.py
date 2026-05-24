from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.core.config import get_settings


class Base(DeclarativeBase):
    pass


def _build_engine(database_url: str):
    engine_kwargs: dict[str, object] = {"future": True}
    if database_url.startswith("sqlite"):
        engine_kwargs["connect_args"] = {"check_same_thread": False}
        if database_url.endswith(":memory:"):
            engine_kwargs["poolclass"] = StaticPool
    return create_engine(database_url, **engine_kwargs)


_settings = get_settings()
ENGINE = _build_engine(_settings.database_url)
SessionLocal = sessionmaker(bind=ENGINE, autoflush=False, expire_on_commit=False)


def configure_database(database_url: str) -> None:
    global ENGINE, SessionLocal
    ENGINE.dispose(close=False)
    ENGINE = _build_engine(database_url)
    SessionLocal = sessionmaker(bind=ENGINE, autoflush=False, expire_on_commit=False)


def init_db() -> None:
    from backend.app import models  # noqa: F401

    Base.metadata.create_all(bind=ENGINE)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

