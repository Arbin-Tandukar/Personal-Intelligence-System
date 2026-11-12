"""Study-related schemas: Subject, StudySession, ExamResult."""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ── Subject ──────────────────────────────────────────────────────────────────

class SubjectCreate(BaseModel):
    """Schema for creating a subject."""

    name: str = Field(..., min_length=1, max_length=100)
    category: Optional[str] = Field(None, max_length=50)
    target_hours: Optional[float] = Field(None, ge=0)
    color: Optional[str] = Field(None, max_length=7, pattern=r"^#[0-9A-Fa-f]{6}$")


class SubjectUpdate(BaseModel):
    """Schema for updating a subject."""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    category: Optional[str] = Field(None, max_length=50)
    target_hours: Optional[float] = Field(None, ge=0)
    color: Optional[str] = Field(None, max_length=7, pattern=r"^#[0-9A-Fa-f]{6}$")


class SubjectResponse(BaseModel):
    """Schema for subject response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    name: str
    category: Optional[str] = None
    target_hours: Optional[float] = None
    color: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Study Session ────────────────────────────────────────────────────────────

class StudySessionCreate(BaseModel):
    """Schema for creating a study session."""

    subject_id: str
    date: date
    duration_minutes: int = Field(..., gt=0)
    topics: Optional[str] = None
    notes: Optional[str] = None
    mood: Optional[str] = Field(None, max_length=20)


class StudySessionUpdate(BaseModel):
    """Schema for updating a study session."""

    subject_id: Optional[str] = None
    date: Optional[date] = None
    duration_minutes: Optional[int] = Field(None, gt=0)
    topics: Optional[str] = None
    notes: Optional[str] = None
    mood: Optional[str] = Field(None, max_length=20)


class StudySessionResponse(BaseModel):
    """Schema for study session response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    subject_id: str
    date: date
    duration_minutes: int
    topics: Optional[str] = None
    notes: Optional[str] = None
    mood: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Exam Result ──────────────────────────────────────────────────────────────

class ExamResultCreate(BaseModel):
    """Schema for creating an exam result."""

    subject_id: str
    exam_name: str = Field(..., min_length=1, max_length=100)
    date: date
    score: float = Field(..., ge=0)
    max_score: float = Field(..., gt=0)
    notes: Optional[str] = None


class ExamResultUpdate(BaseModel):
    """Schema for updating an exam result."""

    subject_id: Optional[str] = None
    exam_name: Optional[str] = Field(None, min_length=1, max_length=100)
    date: Optional[date] = None
    score: Optional[float] = Field(None, ge=0)
    max_score: Optional[float] = Field(None, gt=0)
    notes: Optional[str] = None


class ExamResultResponse(BaseModel):
    """Schema for exam result response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    subject_id: str
    exam_name: str
    date: date
    score: float
    max_score: float
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
