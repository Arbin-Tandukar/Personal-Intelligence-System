"""Goals router for tracking cross-module goals."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..models.goals import Goal
from ..schemas.goals import GoalCreate, GoalUpdate, GoalResponse
from ..auth.dependencies import get_current_user

router = APIRouter(prefix="/api/goals", tags=["Goals"])


@router.get("", response_model=List[GoalResponse])
def get_goals(
    module: Optional[str] = None,
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List goals with optional module and status filters."""
    query = db.query(Goal).filter(Goal.user_id == current_user.id)
    if module:
        query = query.filter(Goal.module == module)
    if status_filter:
        query = query.filter(Goal.status == status_filter)
    return query.order_by(Goal.deadline.asc().nullslast(), Goal.created_at.desc()).all()


@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(
    data: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new goal."""
    goal = Goal(**data.model_dump(), user_id=current_user.id)
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: str,
    data: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a goal."""
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    old_status = goal.status
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(goal, key, value)

    if old_status != "completed" and goal.status == "completed":
        current_user.xp += 50
        current_user.level = (current_user.xp // 100) + 1

    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a goal."""
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return None
