"""Goal schemas."""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class GoalCreate(BaseModel):
    """Schema for creating a goal."""

    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    module: str = Field(
        ...,
        pattern=r"^(study|fitness|habits|finance|tasks|general)$",
    )
    target_value: Optional[float] = Field(None, ge=0)
    current_value: float = Field(default=0, ge=0)
    unit: Optional[str] = Field(None, max_length=20)
    deadline: Optional[date] = None
    status: str = Field(
        default="active",
        pattern=r"^(active|completed|paused|abandoned)$",
    )


class GoalUpdate(BaseModel):
    """Schema for updating a goal."""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    module: Optional[str] = Field(
        None,
        pattern=r"^(study|fitness|habits|finance|tasks|general)$",
    )
    target_value: Optional[float] = Field(None, ge=0)
    current_value: Optional[float] = Field(None, ge=0)
    unit: Optional[str] = Field(None, max_length=20)
    deadline: Optional[date] = None
    status: Optional[str] = Field(
        None,
        pattern=r"^(active|completed|paused|abandoned)$",
    )


class GoalResponse(BaseModel):
    """Schema for goal response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    module: str
    target_value: Optional[float] = None
    current_value: float
    unit: Optional[str] = None
    deadline: Optional[date] = None
    status: str
    created_at: datetime
    updated_at: datetime
