from fastapi import APIRouter
from app.api.v1.search import router as search_router
from app.api.v1.summaries import router as summaries_router
from app.api.v1.cases import router as cases_router
from app.api.v1.predictions import router as predictions_router
from app.api.v1.auth import router as auth_router

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(search_router)
api_v1_router.include_router(summaries_router)
api_v1_router.include_router(cases_router)
api_v1_router.include_router(predictions_router)
api_v1_router.include_router(auth_router)

__all__ = ["api_v1_router"]
