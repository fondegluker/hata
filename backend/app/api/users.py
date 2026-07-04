"""User management API routes."""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import AdminUser, CurrentUser, DBSession
from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter()


@router.get("/", response_model=list[UserResponse])
async def list_users(
    admin: AdminUser,
    db: DBSession,
    skip: int = 0,
    limit: int = 100,
) -> list[User]:
    """List all users (admin only)."""
    result = await db.execute(select(User).offset(skip).limit(limit))
    return list(result.scalars().all())


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: CurrentUser) -> User:
    """Get current user profile."""
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    current_user: CurrentUser,
    update_data: UserUpdate,
    db: DBSession,
) -> User:
    """Update current user profile."""
    update_fields = update_data.model_dump(exclude_unset=True)

    # Handle password update
    if "password" in update_fields:
        update_fields["hashed_password"] = get_password_hash(update_fields.pop("password"))

    # Check email uniqueness
    if "email" in update_fields and update_fields["email"] != current_user.email:
        result = await db.execute(select(User).where(User.email == update_fields["email"]))
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

    # Check username uniqueness
    if "username" in update_fields and update_fields["username"] != current_user.username:
        result = await db.execute(select(User).where(User.username == update_fields["username"]))
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken",
            )

    # Update user
    for field, value in update_fields.items():
        setattr(current_user, field, value)

    await db.commit()
    await db.refresh(current_user)

    return current_user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(
    current_user: CurrentUser,
    db: DBSession,
) -> None:
    """Delete current user account."""
    await db.delete(current_user)
    await db.commit()


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    admin: AdminUser,
    db: DBSession,
) -> User:
    """Get user by ID (admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user
