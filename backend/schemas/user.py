"""User schemas for request/response validation."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    """Schema for creating a new user."""

    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5, max_length=100)
    password: str = Field(..., min_length=6, max_length=100)


class UserLogin(BaseModel):
    """Schema for user login."""

    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class UserUpdate(BaseModel):
    """Schema for updating user info."""

    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[str] = Field(None, min_length=5, max_length=100)
    currency: Optional[str] = Field(None, max_length=10)
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    """Schema for user response (excludes password)."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str
    email: str
    is_active: bool
    currency: str
    xp: int
    level: int
    created_at: datetime
    updated_at: datetime


class TokenData(BaseModel):
    """Schema for JWT token payload data."""

    user_id: str
    username: str


class TokenResponse(BaseModel):
    """Schema for JWT token response."""

    access_token: str
    token_type: str = "bearer"
