"""Journal entry model."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from ..database import Base


class JournalEntry(Base):
    """Journal / idea / note entry."""

    __tablename__ = "journal_entries"

    id = Column(String(36), primary_key=True, default=lambda: uuid.uuid4().hex)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    entry_type = Column(String(20), default="journal")  # journal, idea, note, experience, learning
    category = Column(String(50), nullable=True)
    tags = Column(Text, nullable=True)  # Comma-separated or JSON
    mood = Column(String(20), nullable=True)
    is_pinned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="journal_entries")
