"""Settings API routes."""

from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser, DBSession
from app.models.settings import AppSettings
from app.schemas.settings import SettingsResponse, SettingsUpdate

router = APIRouter()


@router.get("/", response_model=SettingsResponse)
async def get_settings(current_user: CurrentUser, db: DBSession) -> AppSettings:
    """Get current user settings."""
    result = await db.execute(
        select(AppSettings).where(AppSettings.user_id == current_user.id)
    )
    settings = result.scalar_one_or_none()

    if not settings:
        # Create default settings
        settings = AppSettings(user_id=current_user.id)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)

    return settings


@router.patch("/", response_model=SettingsResponse)
async def update_settings(
    current_user: CurrentUser,
    db: DBSession,
    update_data: SettingsUpdate,
) -> AppSettings:
    """Update current user settings."""
    result = await db.execute(
        select(AppSettings).where(AppSettings.user_id == current_user.id)
    )
    settings = result.scalar_one_or_none()

    if not settings:
        settings = AppSettings(user_id=current_user.id)
        db.add(settings)

    update_fields = update_data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(settings, field, value)

    await db.commit()
    await db.refresh(settings)

    return settings


@router.post("/reset", response_model=SettingsResponse)
async def reset_settings(current_user: CurrentUser, db: DBSession) -> AppSettings:
    """Reset settings to defaults."""
    result = await db.execute(
        select(AppSettings).where(AppSettings.user_id == current_user.id)
    )
    settings = result.scalar_one_or_none()

    if settings:
        await db.delete(settings)

    settings = AppSettings(user_id=current_user.id)
    db.add(settings)
    await db.commit()
    await db.refresh(settings)

    return settings
