"""Fitness router for Workouts and Exercises."""

from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models.user import User
from ..models.fitness import Workout, Exercise
from ..schemas.fitness import (
    WorkoutCreate, WorkoutUpdate, WorkoutResponse,
    ExerciseCreate, ExerciseResponse
)
from ..auth.dependencies import get_current_user

router = APIRouter(prefix="/api/fitness", tags=["Fitness Tracker"])


@router.get("/workouts", response_model=List[WorkoutResponse])
def get_workouts(
    workout_type: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List workouts with optional filters."""
    query = db.query(Workout).filter(Workout.user_id == current_user.id)
    if workout_type:
        query = query.filter(Workout.workout_type == workout_type)
    if start_date:
        query = query.filter(Workout.date >= start_date)
    if end_date:
        query = query.filter(Workout.date <= end_date)
    return query.order_by(Workout.date.desc(), Workout.created_at.desc()).all()


@router.post("/workouts", response_model=WorkoutResponse, status_code=status.HTTP_201_CREATED)
def create_workout(
    data: WorkoutCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create workout with optional nested exercises and award XP."""
    workout = Workout(
        user_id=current_user.id,
        date=data.date,
        workout_type=data.workout_type,
        duration_minutes=data.duration_minutes,
        calories_burned=data.calories_burned,
        notes=data.notes,
    )
    db.add(workout)
    db.flush()

    if data.exercises:
        for ex_data in data.exercises:
            ex = Exercise(
                workout_id=workout.id,
                **ex_data.model_dump(),
            )
            db.add(ex)

    # Award XP: 20 XP per workout session + 5 XP per exercise
    ex_count = len(data.exercises) if data.exercises else 0
    xp_gained = 20 + (ex_count * 5)
    current_user.xp += xp_gained
    current_user.level = (current_user.xp // 100) + 1

    db.commit()
    db.refresh(workout)
    return workout


@router.get("/workouts/{workout_id}", response_model=WorkoutResponse)
def get_workout(
    workout_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get single workout by id."""
    workout = db.query(Workout).filter(Workout.id == workout_id, Workout.user_id == current_user.id).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    return workout


@router.put("/workouts/{workout_id}", response_model=WorkoutResponse)
def update_workout(
    workout_id: str,
    data: WorkoutUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update workout fields."""
    workout = db.query(Workout).filter(Workout.id == workout_id, Workout.user_id == current_user.id).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(workout, key, value)
    db.commit()
    db.refresh(workout)
    return workout


@router.delete("/workouts/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workout(
    workout_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a workout and its exercises."""
    workout = db.query(Workout).filter(Workout.id == workout_id, Workout.user_id == current_user.id).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    db.delete(workout)
    db.commit()
    return None


@router.post("/workouts/{workout_id}/exercises", response_model=ExerciseResponse, status_code=status.HTTP_201_CREATED)
def add_exercise(
    workout_id: str,
    data: ExerciseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add an individual exercise to an existing workout."""
    workout = db.query(Workout).filter(Workout.id == workout_id, Workout.user_id == current_user.id).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    exercise = Exercise(workout_id=workout.id, **data.model_dump())
    db.add(exercise)
    current_user.xp += 5
    current_user.level = (current_user.xp // 100) + 1
    db.commit()
    db.refresh(exercise)
    return exercise


@router.delete("/exercises/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exercise(
    exercise_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an exercise."""
    exercise = db.query(Exercise).join(Workout).filter(
        Exercise.id == exercise_id,
        Workout.user_id == current_user.id
    ).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    db.delete(exercise)
    db.commit()
    return None


@router.get("/stats")
def get_fitness_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Aggregate fitness stats: total workouts, duration, calories, PRs, and type distribution."""
    total_workouts = db.query(func.count(Workout.id)).filter(Workout.user_id == current_user.id).scalar() or 0
    total_duration = db.query(func.coalesce(func.sum(Workout.duration_minutes), 0)).filter(Workout.user_id == current_user.id).scalar() or 0
    total_calories = db.query(func.coalesce(func.sum(Workout.calories_burned), 0)).filter(Workout.user_id == current_user.id).scalar() or 0

    # Workout types count
    types_query = db.query(Workout.workout_type, func.count(Workout.id))\
        .filter(Workout.user_id == current_user.id)\
        .group_by(Workout.workout_type).all()
    type_distribution = {row[0]: row[1] for row in types_query}

    # Personal records
    prs = db.query(Exercise).join(Workout).filter(
        Workout.user_id == current_user.id,
        Exercise.is_personal_record == True
    ).order_by(Exercise.created_at.desc()).limit(10).all()

    pr_list = [{
        "id": pr.id,
        "name": pr.name,
        "weight": pr.weight,
        "reps": pr.reps,
        "distance": pr.distance,
        "duration_seconds": pr.duration_seconds,
        "workout_date": str(pr.workout.date) if pr.workout else None
    } for pr in prs]

    return {
        "total_workouts": total_workouts,
        "total_duration_minutes": total_duration,
        "total_calories_burned": total_calories,
        "type_distribution": type_distribution,
        "personal_records": pr_list,
    }
