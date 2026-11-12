"""Profile model."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from ..database import Base


class Profile(Base):
    """User profile with personal details, goals, and interests."""

    __tablename__ = "profiles"

    id = Column(String(36), primary_key=True, default=lambda: uuid.uuid4().hex)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    full_name = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    goals = Column(Text, nullable=True)  # JSON string
    interests = Column(Text, nullable=True)  # JSON string
    skills = Column(Text, nullable=True)  # JSON string
    milestones = Column(Text, nullable=True)  # JSON string
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="profile")
