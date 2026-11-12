"""Task / Quest / Achievement schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ── Task ─────────────────────────────────────────────────────────────────────

class TaskCreate(BaseModel):
    """Schema for creating a task."""

    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    priority: str = Field(default="medium", pattern=r"^(low|medium|high|urgent)$")
    status: str = Field(default="pending", pattern=r"^(pending|in_progress|completed|cancelled)$")
    category: Optional[str] = Field(None, max_length=50)
    deadline: Optional[datetime] = None
    xp_reward: int = Field(default=10, ge=0)
    quest_id: Optional[str] = None


class TaskUpdate(BaseModel):
    """Schema for updating a task."""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    priority: Optional[str] = Field(None, pattern=r"^(low|medium|high|urgent)$")
    status: Optional[str] = Field(None, pattern=r"^(pending|in_progress|completed|cancelled)$")
    category: Optional[str] = Field(None, max_length=50)
    deadline: Optional[datetime] = None
    xp_reward: Optional[int] = Field(None, ge=0)
    quest_id: Optional[str] = None
    completed_at: Optional[datetime] = None


class TaskResponse(BaseModel):
    """Schema for task response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    priority: str
    status: str
    category: Optional[str] = None
    deadline: Optional[datetime] = None
    xp_reward: int
    completed_at: Optional[datetime] = None
    quest_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Quest ────────────────────────────────────────────────────────────────────

class QuestCreate(BaseModel):
    """Schema for creating a quest."""

    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    status: str = Field(default="active", pattern=r"^(active|completed|abandoned)$")
    xp_reward: int = Field(default=50, ge=0)
    deadline: Optional[datetime] = None


class QuestUpdate(BaseModel):
    """Schema for updating a quest."""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[str] = Field(None, pattern=r"^(active|completed|abandoned)$")
    xp_reward: Optional[int] = Field(None, ge=0)
    deadline: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class QuestResponse(BaseModel):
    """Schema for quest response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    status: str
    xp_reward: int
    deadline: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


# ── Achievement ──────────────────────────────────────────────────────────────

class AchievementCreate(BaseModel):
    """Schema for creating an achievement."""

    title: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = Field(None, max_length=50)
    xp_reward: int = Field(default=25, ge=0)
    unlocked_at: datetime


class AchievementResponse(BaseModel):
    """Schema for achievement response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    icon: Optional[str] = None
    xp_reward: int
    unlocked_at: datetime
    created_at: datetime
    updated_at: datetime
