"""Habit-tracking models: Habit, HabitCompletion."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Integer, Float, Boolean, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from ..database import Base


class Habit(Base):
    """Habit definition and configuration."""

    __tablename__ = "habits"

    id = Column(String(36), primary_key=True, default=lambda: uuid.uuid4().hex)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    frequency = Column(String(20), default="daily")  # daily, weekly, monthly
    target_per_period = Column(Integer, default=1)
    category = Column(String(50), nullable=True)
    color = Column(String(7), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="habits")
    completions = relationship("HabitCompletion", back_populates="habit", cascade="all, delete-orphan")


class HabitCompletion(Base):
    """Record of a habit being completed on a specific date."""

    __tablename__ = "habit_completions"

    id = Column(String(36), primary_key=True, default=lambda: uuid.uuid4().hex)
    habit_id = Column(String(36), ForeignKey("habits.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    completed = Column(Boolean, default=True)
    value = Column(Float, nullable=True)  # For quantifiable habits
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    habit = relationship("Habit", back_populates="completions")
