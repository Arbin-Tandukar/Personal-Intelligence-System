"""Habits router for tracking habits, daily completions, and streaks."""

from datetime import date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models.user import User
from ..models.habits import Habit, HabitCompletion
from ..schemas.habits import (
    HabitCreate, HabitUpdate, HabitResponse,
    HabitCompletionCreate, HabitCompletionResponse
)
from ..auth.dependencies import get_current_user

router = APIRouter(prefix="/api/habits", tags=["Habit Tracker"])


@router.get("", response_model=List[HabitResponse])
def get_habits(
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all habits for the user."""
    query = db.query(Habit).filter(Habit.user_id == current_user.id)
    if active_only:
        query = query.filter(Habit.is_active == True)
    return query.order_by(Habit.created_at.asc()).all()


@router.post("", response_model=HabitResponse, status_code=status.HTTP_201_CREATED)
def create_habit(
    data: HabitCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new habit."""
    habit = Habit(**data.model_dump(), user_id=current_user.id)
    db.add(habit)
    db.commit()
    db.refresh(habit)
    return habit


@router.put("/{habit_id}", response_model=HabitResponse)
def update_habit(
    habit_id: str,
    data: HabitUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a habit."""
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(habit, key, value)
    db.commit()
    db.refresh(habit)
    return habit


@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_habit(
    habit_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a habit and its completion history."""
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    db.delete(habit)
    db.commit()
    return None


@router.post("/toggle")
def toggle_habit_completion(
    data: HabitCompletionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Toggle completion status of a habit for a given date. Awards XP on complete."""
    # Ensure habit belongs to user
    habit = db.query(Habit).filter(Habit.id == data.habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    existing = db.query(HabitCompletion).filter(
        HabitCompletion.habit_id == data.habit_id,
        HabitCompletion.date == data.date
    ).first()

    if existing:
        existing.completed = not existing.completed
        if existing.completed:
            current_user.xp += 10
        else:
            current_user.xp = max(0, current_user.xp - 10)
        current_user.level = (current_user.xp // 100) + 1
        db.commit()
        db.refresh(existing)
        return {
            "habit_id": habit.id,
            "date": str(data.date),
            "completed": existing.completed,
            "status": "updated"
        }
    else:
        completion = HabitCompletion(
            habit_id=data.habit_id,
            date=data.date,
            completed=data.completed,
            value=data.value,
            notes=data.notes,
        )
        db.add(completion)
        if data.completed:
            current_user.xp += 10
            current_user.level = (current_user.xp // 100) + 1
        db.commit()
        return {
            "habit_id": habit.id,
            "date": str(data.date),
            "completed": data.completed,
            "status": "created"
        }


def _calculate_streaks(habit_id: str, db: Session):
    """Helper to calculate current and longest streaks for a habit."""
    completions = db.query(HabitCompletion.date)\
        .filter(HabitCompletion.habit_id == habit_id, HabitCompletion.completed == True)\
        .order_by(HabitCompletion.date.desc()).all()

    if not completions:
        return 0, 0

    dates = sorted(list({c[0] for c in completions}))
    today = date.today()
    yesterday = today - timedelta(days=1)

    # Current streak
    current_streak = 0
    check_date = today if (dates and dates[-1] == today) else yesterday

    if dates and (dates[-1] == today or dates[-1] == yesterday):
        current_streak = 1
        idx = len(dates) - 1
        while idx > 0:
            if (dates[idx] - dates[idx - 1]).days == 1:
                current_streak += 1
                idx -= 1
            else:
                break

    # Longest streak
    longest_streak = 0
    temp_streak = 0
    for i in range(len(dates)):
        if i == 0 or (dates[i] - dates[i-1]).days == 1:
            temp_streak += 1
        else:
            temp_streak = 1
        if temp_streak > longest_streak:
            longest_streak = temp_streak

    return current_streak, longest_streak


@router.get("/overview")
def get_habits_overview(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get rich overview with today's status, streaks, and completion history for calendar grids."""
    habits = db.query(Habit).filter(Habit.user_id == current_user.id, Habit.is_active == True).all()
    today = date.today()
    start_date = today - timedelta(days=days - 1)

    result = []
    for h in habits:
        cur_streak, max_streak = _calculate_streaks(h.id, db)
        completions = db.query(HabitCompletion)\
            .filter(HabitCompletion.habit_id == h.id, HabitCompletion.date >= start_date)\
            .all()

        history_map = {str(c.date): c.completed for c in completions}
        completed_today = history_map.get(str(today), False)

        # 30-day completion rate
        completed_count = sum(1 for val in history_map.values() if val)
        completion_rate = round((completed_count / days) * 100, 1)

        result.append({
            "id": h.id,
            "name": h.name,
            "category": h.category,
            "frequency": h.frequency,
            "color": h.color or "#00b894",
            "current_streak": cur_streak,
            "longest_streak": max_streak,
            "completed_today": completed_today,
            "completion_rate": completion_rate,
            "history": history_map,
        })

    return {
        "today": str(today),
        "habits": result,
        "total_active": len(habits),
        "completed_today_count": sum(1 for item in result if item["completed_today"]),
    }
