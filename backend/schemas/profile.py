"""Profile schemas."""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ProfileCreate(BaseModel):
    """Schema for creating a profile."""

    full_name: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = None
    date_of_birth: Optional[date] = None
    goals: Optional[str] = None  # JSON string
    interests: Optional[str] = None  # JSON string
    skills: Optional[str] = None  # JSON string
    milestones: Optional[str] = None  # JSON string
    notes: Optional[str] = None


class ProfileUpdate(BaseModel):
    """Schema for updating a profile."""

    full_name: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = None
    date_of_birth: Optional[date] = None
    goals: Optional[str] = None
    interests: Optional[str] = None
    skills: Optional[str] = None
    milestones: Optional[str] = None
    notes: Optional[str] = None


class ProfileResponse(BaseModel):
    """Schema for profile response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    full_name: Optional[str] = None
    bio: Optional[str] = None
    date_of_birth: Optional[date] = None
    goals: Optional[str] = None
    interests: Optional[str] = None
    skills: Optional[str] = None
    milestones: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
