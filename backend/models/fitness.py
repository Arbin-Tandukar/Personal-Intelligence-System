"""Fitness-related models: Workout, Exercise."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Integer, Float, Boolean, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from ..database import Base


class Workout(Base):
    """Workout session record."""

    __tablename__ = "workouts"

    id = Column(String(36), primary_key=True, default=lambda: uuid.uuid4().hex)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    workout_type = Column(String(50), nullable=False)  # strength, cardio, flexibility, etc.
    duration_minutes = Column(Integer, nullable=False)
    calories_burned = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="workouts")
    exercises = relationship("Exercise", back_populates="workout", cascade="all, delete-orphan")


class Exercise(Base):
    """Individual exercise within a workout."""

    __tablename__ = "exercises"

    id = Column(String(36), primary_key=True, default=lambda: uuid.uuid4().hex)
    workout_id = Column(String(36), ForeignKey("workouts.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    sets = Column(Integer, nullable=True)
    reps = Column(Integer, nullable=True)
    weight = Column(Float, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    distance = Column(Float, nullable=True)
    is_personal_record = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    workout = relationship("Workout", back_populates="exercises")
