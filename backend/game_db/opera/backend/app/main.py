from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.router import api_router
from backend.app.core.config import get_settings
from backend.app.db import configure_database, init_db
from backend.app.services.openrouter import (
    reset_request_openrouter_api_key,
    set_request_openrouter_api_key,
)


def create_app(database_url: str | None = None) -> FastAPI:
    settings = get_settings()
    if database_url:
        configure_database(database_url)
    app = FastAPI(title=settings.app_name)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def on_startup() -> None:
        init_db()

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.middleware("http")
    async def bind_openrouter_api_key(request: Request, call_next):
        token = set_request_openrouter_api_key(request.headers.get("x-openrouter-api-key"))
        try:
            return await call_next(request)
        finally:
            reset_request_openrouter_api_key(token)

    app.include_router(api_router, prefix=settings.api_prefix)
    return app


app = create_app()
