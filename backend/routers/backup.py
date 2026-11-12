"""Backup & Restore router for local-first data ownership."""

import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..models.profile import Profile
from ..models.study import Subject, StudySession, ExamResult
from ..models.fitness import Workout, Exercise
from ..models.habits import Habit, HabitCompletion
from ..models.finance import Transaction, Budget
from ..models.tasks import Task, Quest, Achievement
from ..models.journal import JournalEntry
from ..models.goals import Goal
from ..auth.dependencies import get_current_user

router = APIRouter(prefix="/api/backup", tags=["Backup & Restore"])


@router.get("/export")
def export_user_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Export complete personal data as a structured JSON file."""
    # Profile
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    profile_data = {
        "full_name": profile.full_name if profile else None,
        "bio": profile.bio if profile else None,
        "goals": profile.goals if profile else "[]",
        "interests": profile.interests if profile else "[]",
        "skills": profile.skills if profile else "[]",
        "milestones": profile.milestones if profile else "[]",
        "notes": profile.notes if profile else None,
    }

    # Study
    subjects = db.query(Subject).filter(Subject.user_id == current_user.id).all()
    sessions = db.query(StudySession).filter(StudySession.user_id == current_user.id).all()
    exams = db.query(ExamResult).filter(ExamResult.user_id == current_user.id).all()

    # Fitness
    workouts = db.query(Workout).filter(Workout.user_id == current_user.id).all()

    # Habits
    habits = db.query(Habit).filter(Habit.user_id == current_user.id).all()

    # Finance
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    budgets = db.query(Budget).filter(Budget.user_id == current_user.id).all()

    # Tasks
    tasks = db.query(Task).filter(Task.user_id == current_user.id).all()
    quests = db.query(Quest).filter(Quest.user_id == current_user.id).all()
    achievements = db.query(Achievement).filter(Achievement.user_id == current_user.id).all()

    # Journal
    journal = db.query(JournalEntry).filter(JournalEntry.user_id == current_user.id).all()

    # Goals
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()

    backup_payload = {
        "version": "1.0",
        "exported_at": datetime.utcnow().isoformat(),
        "user": {
            "username": current_user.username,
            "email": current_user.email,
            "currency": current_user.currency,
            "xp": current_user.xp,
            "level": current_user.level,
        },
        "profile": profile_data,
        "study": {
            "subjects": [{"id": s.id, "name": s.name, "category": s.category, "target_hours": s.target_hours, "color": s.color} for s in subjects],
            "sessions": [{"id": ss.id, "subject_id": ss.subject_id, "date": str(ss.date), "duration_minutes": ss.duration_minutes, "topics": ss.topics, "notes": ss.notes} for ss in sessions],
            "exams": [{"id": e.id, "subject_id": e.subject_id, "exam_name": e.exam_name, "date": str(e.date), "score": e.score, "max_score": e.max_score, "notes": e.notes} for e in exams],
        },
        "fitness": [
            {
                "id": w.id,
                "date": str(w.date),
                "workout_type": w.workout_type,
                "duration_minutes": w.duration_minutes,
                "calories_burned": w.calories_burned,
                "notes": w.notes,
                "exercises": [
                    {
                        "name": ex.name,
                        "sets": ex.sets,
                        "reps": ex.reps,
                        "weight": ex.weight,
                        "duration_seconds": ex.duration_seconds,
                        "distance": ex.distance,
                        "is_personal_record": ex.is_personal_record,
                        "notes": ex.notes,
                    } for ex in w.exercises
                ]
            } for w in workouts
        ],
        "habits": [
            {
                "id": h.id,
                "name": h.name,
                "frequency": h.frequency,
                "category": h.category,
                "color": h.color,
                "completions": [
                    {"date": str(c.date), "completed": c.completed, "notes": c.notes}
                    for c in h.completions
                ]
            } for h in habits
        ],
        "finance": {
            "transactions": [{"amount": t.amount, "transaction_type": t.transaction_type, "category": t.category, "description": t.description, "date": str(t.date), "currency": t.currency} for t in transactions],
            "budgets": [{"category": b.category, "amount": b.amount, "month": b.month, "year": b.year} for b in budgets],
        },
        "tasks": [{"title": t.title, "description": t.description, "priority": t.priority, "status": t.status, "category": t.category, "xp_reward": t.xp_reward, "completed_at": str(t.completed_at) if t.completed_at else None} for t in tasks],
        "quests": [{"title": q.title, "description": q.description, "status": q.status, "xp_reward": q.xp_reward} for q in quests],
        "journal": [{"title": j.title, "content": j.content, "entry_type": j.entry_type, "category": j.category, "tags": j.tags, "mood": j.mood, "is_pinned": j.is_pinned, "created_at": str(j.created_at)} for j in journal],
        "goals": [{"title": g.title, "description": g.description, "module": g.module, "target_value": g.target_value, "current_value": g.current_value, "unit": g.unit, "status": g.status} for g in goals],
    }

    content = json.dumps(backup_payload, indent=2)
    filename = f"pis_backup_{current_user.username}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
    return Response(
        content=content,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
