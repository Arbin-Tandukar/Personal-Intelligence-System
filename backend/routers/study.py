"""Study router for Subjects, Study Sessions, and Exam Results."""

from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models.user import User
from ..models.study import Subject, StudySession, ExamResult
from ..schemas.study import (
    SubjectCreate, SubjectUpdate, SubjectResponse,
    StudySessionCreate, StudySessionUpdate, StudySessionResponse,
    ExamResultCreate, ExamResultUpdate, ExamResultResponse,
)
from ..auth.dependencies import get_current_user

router = APIRouter(prefix="/api/study", tags=["Study Tracker"])


# ── Subjects ─────────────────────────────────────────────────────────────────

@router.get("/subjects", response_model=List[SubjectResponse])
def get_subjects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all subjects for current user."""
    return db.query(Subject).filter(Subject.user_id == current_user.id).all()


@router.post("/subjects", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(
    data: SubjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new study subject."""
    subject = Subject(**data.model_dump(), user_id=current_user.id)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@router.put("/subjects/{subject_id}", response_model=SubjectResponse)
def update_subject(
    subject_id: str,
    data: SubjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a subject."""
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(subject, key, value)
    db.commit()
    db.refresh(subject)
    return subject


@router.delete("/subjects/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(
    subject_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a subject and related sessions/exams."""
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    db.delete(subject)
    db.commit()
    return None


# ── Study Sessions ───────────────────────────────────────────────────────────

@router.get("/sessions", response_model=List[StudySessionResponse])
def get_study_sessions(
    subject_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List study sessions with optional filters."""
    query = db.query(StudySession).filter(StudySession.user_id == current_user.id)
    if subject_id:
        query = query.filter(StudySession.subject_id == subject_id)
    if start_date:
        query = query.filter(StudySession.date >= start_date)
    if end_date:
        query = query.filter(StudySession.date <= end_date)
    return query.order_by(StudySession.date.desc(), StudySession.created_at.desc()).all()


@router.post("/sessions", response_model=StudySessionResponse, status_code=status.HTTP_201_CREATED)
def create_study_session(
    data: StudySessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Record a study session and reward user XP (1 XP per 10 minutes studied)."""
    # Verify subject belongs to user
    subject = db.query(Subject).filter(Subject.id == data.subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    session = StudySession(**data.model_dump(), user_id=current_user.id)
    db.add(session)

    # Award XP to user
    xp_earned = max(1, data.duration_minutes // 10)
    current_user.xp += xp_earned
    current_user.level = (current_user.xp // 100) + 1

    db.commit()
    db.refresh(session)
    return session


@router.put("/sessions/{session_id}", response_model=StudySessionResponse)
def update_study_session(
    session_id: str,
    data: StudySessionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a study session."""
    session = db.query(StudySession).filter(StudySession.id == session_id, StudySession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Study session not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(session, key, value)
    db.commit()
    db.refresh(session)
    return session


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_study_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a study session."""
    session = db.query(StudySession).filter(StudySession.id == session_id, StudySession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Study session not found")
    db.delete(session)
    db.commit()
    return None


# ── Exam Results ─────────────────────────────────────────────────────────────

@router.get("/exams", response_model=List[ExamResultResponse])
def get_exam_results(
    subject_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List exam/test results."""
    query = db.query(ExamResult).filter(ExamResult.user_id == current_user.id)
    if subject_id:
        query = query.filter(ExamResult.subject_id == subject_id)
    return query.order_by(ExamResult.date.desc()).all()


@router.post("/exams", response_model=ExamResultResponse, status_code=status.HTTP_201_CREATED)
def create_exam_result(
    data: ExamResultCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Record an exam result."""
    subject = db.query(Subject).filter(Subject.id == data.subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    exam = ExamResult(**data.model_dump(), user_id=current_user.id)
    db.add(exam)
    # XP bonus for recording exam
    current_user.xp += 15
    current_user.level = (current_user.xp // 100) + 1
    db.commit()
    db.refresh(exam)
    return exam


@router.delete("/exams/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam_result(
    exam_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an exam result."""
    exam = db.query(ExamResult).filter(ExamResult.id == exam_id, ExamResult.user_id == current_user.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam result not found")
    db.delete(exam)
    db.commit()
    return None


# ── Study Statistics ─────────────────────────────────────────────────────────

@router.get("/stats")
def get_study_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Aggregate study stats: total hours, breakdown by subject, recent trend."""
    total_minutes = db.query(func.coalesce(func.sum(StudySession.duration_minutes), 0))\
        .filter(StudySession.user_id == current_user.id).scalar()

    # Subject breakdown
    subjects = db.query(Subject).filter(Subject.user_id == current_user.id).all()
    subject_stats = []
    for s in subjects:
        sub_minutes = db.query(func.coalesce(func.sum(StudySession.duration_minutes), 0))\
            .filter(StudySession.subject_id == s.id, StudySession.user_id == current_user.id).scalar()
        subject_stats.append({
            "id": s.id,
            "name": s.name,
            "color": s.color or "#6c5ce7",
            "target_hours": s.target_hours or 0.0,
            "total_minutes": sub_minutes,
            "total_hours": round(sub_minutes / 60.0, 1),
        })

    # Recent 7 days daily minutes
    recent_sessions = db.query(StudySession.date, func.sum(StudySession.duration_minutes))\
        .filter(StudySession.user_id == current_user.id)\
        .group_by(StudySession.date)\
        .order_by(StudySession.date.desc())\
        .limit(14).all()

    daily_trend = [{"date": str(r[0]), "minutes": r[1]} for r in reversed(recent_sessions)]

    return {
        "total_minutes": total_minutes,
        "total_hours": round(total_minutes / 60.0, 1),
        "subject_breakdown": subject_stats,
        "daily_trend": daily_trend,
    }
