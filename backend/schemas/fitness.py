"""Fitness-related schemas: Workout, Exercise."""

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ── Exercise ─────────────────────────────────────────────────────────────────

class ExerciseCreate(BaseModel):
    """Schema for creating an exercise within a workout."""

    name: str = Field(..., min_length=1, max_length=100)
    sets: Optional[int] = Field(None, ge=0)
    reps: Optional[int] = Field(None, ge=0)
    weight: Optional[float] = Field(None, ge=0)
    duration_seconds: Optional[int] = Field(None, ge=0)
    distance: Optional[float] = Field(None, ge=0)
    is_personal_record: bool = False
    notes: Optional[str] = None


class ExerciseUpdate(BaseModel):
    """Schema for updating an exercise."""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    sets: Optional[int] = Field(None, ge=0)
    reps: Optional[int] = Field(None, ge=0)
    weight: Optional[float] = Field(None, ge=0)
    duration_seconds: Optional[int] = Field(None, ge=0)
    distance: Optional[float] = Field(None, ge=0)
    is_personal_record: Optional[bool] = None
    notes: Optional[str] = None


class ExerciseResponse(BaseModel):
    """Schema for exercise response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    workout_id: str
    name: str
    sets: Optional[int] = None
    reps: Optional[int] = None
    weight: Optional[float] = None
    duration_seconds: Optional[int] = None
    distance: Optional[float] = None
    is_personal_record: bool
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Workout ──────────────────────────────────────────────────────────────────

class WorkoutCreate(BaseModel):
    """Schema for creating a workout (with optional nested exercises)."""

    date: date
    workout_type: str = Field(..., min_length=1, max_length=50)
    duration_minutes: int = Field(..., gt=0)
    calories_burned: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = None
    exercises: Optional[List[ExerciseCreate]] = None


class WorkoutUpdate(BaseModel):
    """Schema for updating a workout."""

    date: Optional[date] = None
    workout_type: Optional[str] = Field(None, min_length=1, max_length=50)
    duration_minutes: Optional[int] = Field(None, gt=0)
    calories_burned: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = None


class WorkoutResponse(BaseModel):
    """Schema for workout response (includes exercises)."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    date: date
    workout_type: str
    duration_minutes: int
    calories_burned: Optional[int] = None
    notes: Optional[str] = None
    exercises: List[ExerciseResponse] = []
    created_at: datetime
    updated_at: datetime
