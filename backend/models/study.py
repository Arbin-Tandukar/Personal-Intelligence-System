"""Study-related models: Subject, StudySession, ExamResult."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Integer, Float, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from ..database import Base


class Subject(Base):
    """Academic subject being studied."""

    __tablename__ = "subjects"

    id = Column(String(36), primary_key=True, default=lambda: uuid.uuid4().hex)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=True)
    target_hours = Column(Float, nullable=True)
    color = Column(String(7), nullable=True)  # Hex color e.g. #FF5733
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="subjects")
    study_sessions = relationship("StudySession", back_populates="subject", cascade="all, delete-orphan")
    exam_results = relationship("ExamResult", back_populates="subject", cascade="all, delete-orphan")


class StudySession(Base):
    """Individual study session record."""

    __tablename__ = "study_sessions"

    id = Column(String(36), primary_key=True, default=lambda: uuid.uuid4().hex)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    topics = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    mood = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="study_sessions")
    subject = relationship("Subject", back_populates="study_sessions")


class ExamResult(Base):
    """Exam / test result record."""

    __tablename__ = "exam_results"

    id = Column(String(36), primary_key=True, default=lambda: uuid.uuid4().hex)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    exam_name = Column(String(100), nullable=False)
    date = Column(Date, nullable=False)
    score = Column(Float, nullable=False)
    max_score = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="exam_results")
    subject = relationship("Subject", back_populates="exam_results")
