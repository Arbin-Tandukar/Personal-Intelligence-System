"""Goal model."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Float, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from ..database import Base


class Goal(Base):
    """Cross-module goal tracking."""

    __tablename__ = "goals"

    id = Column(String(36), primary_key=True, default=lambda: uuid.uuid4().hex)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    module = Column(String(50), nullable=False)  # study, fitness, habits, finance, tasks, general
    target_value = Column(Float, nullable=True)
    current_value = Column(Float, default=0)
    unit = Column(String(20), nullable=True)  # hours, kg, count, NPR, etc.
    deadline = Column(Date, nullable=True)
    status = Column(String(20), default="active")  # active, completed, paused, abandoned
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="goals")
