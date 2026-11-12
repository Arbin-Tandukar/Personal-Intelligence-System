"""Habit-tracking schemas: Habit, HabitCompletion."""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ── Habit ────────────────────────────────────────────────────────────────────

class HabitCreate(BaseModel):
    """Schema for creating a habit."""

    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    frequency: str = Field(default="daily", pattern=r"^(daily|weekly|monthly)$")
    target_per_period: int = Field(default=1, ge=1)
    category: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=7, pattern=r"^#[0-9A-Fa-f]{6}$")
    is_active: bool = True


class HabitUpdate(BaseModel):
    """Schema for updating a habit."""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    frequency: Optional[str] = Field(None, pattern=r"^(daily|weekly|monthly)$")
    target_per_period: Optional[int] = Field(None, ge=1)
    category: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=7, pattern=r"^#[0-9A-Fa-f]{6}$")
    is_active: Optional[bool] = None


class HabitResponse(BaseModel):
    """Schema for habit response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    frequency: str
    target_per_period: int
    category: Optional[str] = None
    color: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


# ── Habit Completion ─────────────────────────────────────────────────────────

class HabitCompletionCreate(BaseModel):
    """Schema for recording a habit completion."""

    habit_id: str
    date: date
    completed: bool = True
    value: Optional[float] = None
    notes: Optional[str] = None


class HabitCompletionResponse(BaseModel):
    """Schema for habit completion response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    habit_id: str
    date: date
    completed: bool
    value: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
