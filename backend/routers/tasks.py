"""Tasks, Quests, and Achievements router with gamification & leveling logic."""

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models.user import User
from ..models.tasks import Task, Quest, Achievement
from ..schemas.tasks import (
    TaskCreate, TaskUpdate, TaskResponse,
    QuestCreate, QuestUpdate, QuestResponse,
    AchievementCreate, AchievementResponse,
)
from ..auth.dependencies import get_current_user

router = APIRouter(prefix="/api/tasks", tags=["Tasks & Quests"])


def _check_and_award_achievements(user: User, db: Session):
    """Check user accomplishments and unlock achievements automatically."""
    existing_titles = {a.title for a in user.achievements}

    total_tasks_completed = db.query(func.count(Task.id)).filter(
        Task.user_id == user.id, Task.status == "completed"
    ).scalar() or 0

    to_award = []
    if total_tasks_completed >= 1 and "First Step" not in existing_titles:
        to_award.append(("First Step", "Completed your very first task!", "fa-check", 25))
    if total_tasks_completed >= 10 and "Task Novice" not in existing_titles:
        to_award.append(("Task Novice", "Completed 10 tasks!", "fa-tasks", 50))
    if total_tasks_completed >= 50 and "Master of Execution" not in existing_titles:
        to_award.append(("Master of Execution", "Completed 50 tasks!", "fa-bolt", 100))
    if user.level >= 5 and "Level 5 Achiever" not in existing_titles:
        to_award.append(("Level 5 Achiever", "Reached Level 5!", "fa-medal", 100))

    for title, desc, icon, xp in to_award:
        ach = Achievement(
            user_id=user.id,
            title=title,
            description=desc,
            icon=icon,
            xp_reward=xp,
            unlocked_at=datetime.now(timezone.utc),
        )
        db.add(ach)
        user.xp += xp
        user.level = (user.xp // 100) + 1


# ── Tasks ────────────────────────────────────────────────────────────────────

@router.get("", response_model=List[TaskResponse])
def get_tasks(
    status_filter: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    quest_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List tasks with optional filters."""
    query = db.query(Task).filter(Task.user_id == current_user.id)
    if status_filter:
        query = query.filter(Task.status == status_filter)
    if priority:
        query = query.filter(Task.priority == priority)
    if category:
        query = query.filter(Task.category == category)
    if quest_id:
        query = query.filter(Task.quest_id == quest_id)
    return query.order_by(Task.status.asc(), Task.deadline.asc().nullslast(), Task.created_at.desc()).all()


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new task."""
    task = Task(**data.model_dump(), user_id=current_user.id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: str,
    data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a task, awarding XP when marked completed."""
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    old_status = task.status
    update_dict = data.model_dump(exclude_unset=True)

    for key, value in update_dict.items():
        setattr(task, key, value)

    # Status change logic
    if old_status != "completed" and task.status == "completed":
        task.completed_at = datetime.now(timezone.utc)
        current_user.xp += task.xp_reward or 10
        current_user.level = (current_user.xp // 100) + 1
        _check_and_award_achievements(current_user, db)
    elif old_status == "completed" and task.status != "completed":
        task.completed_at = None
        current_user.xp = max(0, current_user.xp - (task.xp_reward or 10))
        current_user.level = (current_user.xp // 100) + 1

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a task."""
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return None


# ── Quests ───────────────────────────────────────────────────────────────────

@router.get("/quests", response_model=List[QuestResponse])
def get_quests(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List quests."""
    query = db.query(Quest).filter(Quest.user_id == current_user.id)
    if status_filter:
        query = query.filter(Quest.status == status_filter)
    return query.order_by(Quest.created_at.desc()).all()


@router.post("/quests", response_model=QuestResponse, status_code=status.HTTP_201_CREATED)
def create_quest(
    data: QuestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new epic/quest."""
    quest = Quest(**data.model_dump(), user_id=current_user.id)
    db.add(quest)
    db.commit()
    db.refresh(quest)
    return quest


@router.put("/quests/{quest_id}", response_model=QuestResponse)
def update_quest(
    quest_id: str,
    data: QuestUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update quest details or mark complete for bonus XP."""
    quest = db.query(Quest).filter(Quest.id == quest_id, Quest.user_id == current_user.id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    old_status = quest.status
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(quest, key, value)

    if old_status != "completed" and quest.status == "completed":
        quest.completed_at = datetime.now(timezone.utc)
        current_user.xp += quest.xp_reward or 50
        current_user.level = (current_user.xp // 100) + 1
        _check_and_award_achievements(current_user, db)

    db.commit()
    db.refresh(quest)
    return quest


@router.delete("/quests/{quest_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quest(
    quest_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a quest."""
    quest = db.query(Quest).filter(Quest.id == quest_id, Quest.user_id == current_user.id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    db.delete(quest)
    db.commit()
    return None


# ── Achievements ─────────────────────────────────────────────────────────────

@router.get("/achievements", response_model=List[AchievementResponse])
def get_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all unlocked achievements."""
    return db.query(Achievement).filter(Achievement.user_id == current_user.id).order_by(Achievement.unlocked_at.desc()).all()


# ── Stats & Leveling ─────────────────────────────────────────────────────────

@router.get("/stats")
def get_task_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get gamification overview: level, XP, next level goal, tasks breakdown."""
    total_tasks = db.query(func.count(Task.id)).filter(Task.user_id == current_user.id).scalar() or 0
    completed_tasks = db.query(func.count(Task.id)).filter(
        Task.user_id == current_user.id, Task.status == "completed"
    ).scalar() or 0
    pending_tasks = db.query(func.count(Task.id)).filter(
        Task.user_id == current_user.id, Task.status != "completed"
    ).scalar() or 0

    current_level_base = (current_user.level - 1) * 100
    xp_in_level = current_user.xp - current_level_base
    xp_needed = 100

    return {
        "user_id": current_user.id,
        "username": current_user.username,
        "level": current_user.level,
        "xp": current_user.xp,
        "xp_in_level": max(0, xp_in_level),
        "xp_needed": xp_needed,
        "level_progress_percent": min(100, max(0, int((xp_in_level / xp_needed) * 100))),
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks,
        "completion_rate": round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0,
    }
