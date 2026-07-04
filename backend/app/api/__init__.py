"""API routes package."""

from fastapi import APIRouter

from app.api import auth, properties, parser, settings, users, map, export

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(properties.router, prefix="/properties", tags=["Properties"])
api_router.include_router(map.router, prefix="/map", tags=["Map"])
api_router.include_router(parser.router, prefix="/parser", tags=["Parser"])
api_router.include_router(export.router, prefix="/export", tags=["Export"])
api_router.include_router(settings.router, prefix="/settings", tags=["Settings"])
