from __future__ import annotations

from fastapi import APIRouter

from backend.app.services.openrouter import NarrativeService


router = APIRouter()
service = NarrativeService()


@router.get("/status")
def get_openrouter_status() -> dict:
    return service.check_connection()
