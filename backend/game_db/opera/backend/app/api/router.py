from fastapi import APIRouter

from backend.app.api.routes.campaigns import router as campaigns_router
from backend.app.api.routes.novels import router as novels_router
from backend.app.api.routes.openrouter import router as openrouter_router


api_router = APIRouter()
api_router.include_router(campaigns_router, prefix="/campaigns", tags=["campaigns"])
api_router.include_router(novels_router, prefix="/novels", tags=["novels"])
api_router.include_router(openrouter_router, prefix="/openrouter", tags=["openrouter"])

