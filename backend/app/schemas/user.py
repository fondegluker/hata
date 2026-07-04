"""User schemas for authentication and profile."""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """Base user schema."""

    email: EmailStr
    username: str | None = None
    full_name: str | None = None


class UserCreate(UserBase):
    """Schema for user registration."""

    password: str = Field(..., min_length=8, max_length=100)


class UserUpdate(BaseModel):
    """Schema for user profile update."""

    email: EmailStr | None = None
    username: str | None = None
    full_name: str | None = None
    password: str | None = Field(None, min_length=8, max_length=100)
    avatar_url: str | None = None


class UserResponse(UserBase):
    """Schema for user response."""

    id: int
    role: str
    is_active: bool
    avatar_url: str | None = None
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime | None = None

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """Schema for user login."""

    email: EmailStr
    password: str


class Token(BaseModel):
    """Schema for JWT token response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenPayload(BaseModel):
    """Schema for JWT token payload."""

    sub: int  # user_id
    exp: datetime
    iat: datetime
    type: str  # access, refresh
