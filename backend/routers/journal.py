"""Journal and Knowledge Base router."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from ..models.user import User
from ..models.journal import JournalEntry
from ..schemas.journal import (
    JournalEntryCreate, JournalEntryUpdate, JournalEntryResponse
)
from ..auth.dependencies import get_current_user

router = APIRouter(prefix="/api/journal", tags=["Journal & Knowledge Base"])


@router.get("", response_model=List[JournalEntryResponse])
def get_journal_entries(
    search: Optional[str] = None,
    entry_type: Optional[str] = None,
    category: Optional[str] = None,
    is_pinned: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List journal entries with search and filtering capabilities."""
    query = db.query(JournalEntry).filter(JournalEntry.user_id == current_user.id)

    if entry_type:
        query = query.filter(JournalEntry.entry_type == entry_type)
    if category:
        query = query.filter(JournalEntry.category == category)
    if is_pinned is not None:
        query = query.filter(JournalEntry.is_pinned == is_pinned)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                JournalEntry.title.ilike(pattern),
                JournalEntry.content.ilike(pattern),
                JournalEntry.tags.ilike(pattern),
            )
        )

    # Pinned first, then newest
    return query.order_by(JournalEntry.is_pinned.desc(), JournalEntry.created_at.desc()).all()


@router.post("", response_model=JournalEntryResponse, status_code=status.HTTP_201_CREATED)
def create_journal_entry(
    data: JournalEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save a new journal or knowledge base entry."""
    entry = JournalEntry(**data.model_dump(), user_id=current_user.id)
    db.add(entry)
    # XP bonus for journaling
    current_user.xp += 10
    current_user.level = (current_user.xp // 100) + 1
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/{entry_id}", response_model=JournalEntryResponse)
def get_journal_entry(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve a single journal entry."""
    entry = db.query(JournalEntry).filter(JournalEntry.id == entry_id, JournalEntry.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    return entry


@router.put("/{entry_id}", response_model=JournalEntryResponse)
def update_journal_entry(
    entry_id: str,
    data: JournalEntryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a journal entry."""
    entry = db.query(JournalEntry).filter(JournalEntry.id == entry_id, JournalEntry.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(entry, key, value)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_journal_entry(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a journal entry."""
    entry = db.query(JournalEntry).filter(JournalEntry.id == entry_id, JournalEntry.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    db.delete(entry)
    db.commit()
    return None
