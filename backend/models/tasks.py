"""Task / Quest / Achievement models for gamification."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from ..database import Base


class Quest(Base):
    """Multi-task quest (epic) that groups related tasks."""

    __tablename__ = "quests"

    id = Column(String(36), primary_key=True, default=lambda: uuid.uuid4().hex)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="active")  # active, completed, abandoned
    xp_reward = Column(Integer, default=50)
    deadline = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="quests")
    tasks = relationship("Task", back_populates="quest", cascade="all, delete-orphan")


class Task(Base):
    """Individual task, optionally belonging to a quest."""

    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, default=lambda: uuid.uuid4().hex)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String(20), default="medium")  # low, medium, high, urgent
    status = Column(String(20), default="pending")  # pending, in_progress, completed, cancelled
    category = Column(String(50), nullable=True)
    deadline = Column(DateTime, nullable=True)
    xp_reward = Column(Integer, default=10)
    completed_at = Column(DateTime, nullable=True)
    quest_id = Column(String(36), ForeignKey("quests.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="tasks")
    quest = relationship("Quest", back_populates="tasks")


class Achievement(Base):
    """Unlockable achievement / badge."""

    __tablename__ = "achievements"

    id = Column(String(36), primary_key=True, default=lambda: uuid.uuid4().hex)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)
    xp_reward = Column(Integer, default=25)
    unlocked_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="achievements")
