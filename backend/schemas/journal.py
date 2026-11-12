"""Journal entry schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class JournalEntryCreate(BaseModel):
    """Schema for creating a journal entry."""

    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    entry_type: str = Field(
        default="journal",
        pattern=r"^(journal|idea|note|experience|learning)$",
    )
    category: Optional[str] = Field(None, max_length=50)
    tags: Optional[str] = None
    mood: Optional[str] = Field(None, max_length=20)
    is_pinned: bool = False


class JournalEntryUpdate(BaseModel):
    """Schema for updating a journal entry."""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1)
    entry_type: Optional[str] = Field(
        None,
        pattern=r"^(journal|idea|note|experience|learning)$",
    )
    category: Optional[str] = Field(None, max_length=50)
    tags: Optional[str] = None
    mood: Optional[str] = Field(None, max_length=20)
    is_pinned: Optional[bool] = None


class JournalEntryResponse(BaseModel):
    """Schema for journal entry response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    content: str
    entry_type: str
    category: Optional[str] = None
    tags: Optional[str] = None
    mood: Optional[str] = None
    is_pinned: bool
    created_at: datetime
    updated_at: datetime
