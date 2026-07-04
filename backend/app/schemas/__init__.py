"""Pydantic schemas package."""

from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserLogin,
    Token,
    TokenPayload,
)
from app.schemas.property import (
    PropertyCreate,
    PropertyUpdate,
    PropertyResponse,
    PropertyListResponse,
    PropertyFilter,
    PropertyPhotoResponse,
)
from app.schemas.settings import (
    SettingsUpdate,
    SettingsResponse,
)
from app.schemas.parser import (
    ParserStatus,
    ParserProgress,
    ParserStats,
    ParserLog,
)

__all__ = [
    # User schemas
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserLogin",
    "Token",
    "TokenPayload",
    # Property schemas
    "PropertyCreate",
    "PropertyUpdate",
    "PropertyResponse",
    "PropertyListResponse",
    "PropertyFilter",
    "PropertyPhotoResponse",
    # Settings schemas
    "SettingsUpdate",
    "SettingsResponse",
    # Parser schemas
    "ParserStatus",
    "ParserProgress",
    "ParserStats",
    "ParserLog",
]
