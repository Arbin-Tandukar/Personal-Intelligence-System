"""Analytics Engine – combines cross-module data into reports, trends, and correlations."""

from datetime import date, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models.user import User
from ..models.study import StudySession, Subject
from ..models.fitness import Workout
from ..models.habits import Habit, HabitCompletion
from ..models.finance import Transaction
from ..models.tasks import Task
from ..models.goals import Goal


class AnalyticsEngine:
    """Computes comprehensive metrics and correlations without fabricating data."""

    def __init__(self, db: Session, user: User):
        self.db = db
        self.user = user

    def get_dashboard_summary(self) -> Dict[str, Any]:
        """Aggregate high-level overview for today & current week."""
        today = date.today()
        seven_days_ago = today - timedelta(days=6)
        first_day_of_month = today.replace(day=1)

        # 1. Study
        study_today_min = self.db.query(func.coalesce(func.sum(StudySession.duration_minutes), 0))\
            .filter(StudySession.user_id == self.user.id, StudySession.date == today).scalar()
        study_week_min = self.db.query(func.coalesce(func.sum(StudySession.duration_minutes), 0))\
            .filter(StudySession.user_id == self.user.id, StudySession.date >= seven_days_ago).scalar()

        # 2. Tasks
        completed_today_tasks = self.db.query(func.count(Task.id)).filter(
            Task.user_id == self.user.id,
            Task.status == "completed",
            func.date(Task.completed_at) == today
        ).scalar() or 0

        pending_tasks = self.db.query(func.count(Task.id)).filter(
            Task.user_id == self.user.id,
            Task.status != "completed"
        ).scalar() or 0

        # 3. Habits
        active_habits_count = self.db.query(func.count(Habit.id)).filter(
            Habit.user_id == self.user.id, Habit.is_active == True
        ).scalar() or 0

        completed_habits_today = self.db.query(func.count(HabitCompletion.id))\
            .join(Habit)\
            .filter(
                Habit.user_id == self.user.id,
                HabitCompletion.date == today,
                HabitCompletion.completed == True
            ).scalar() or 0

        habit_rate_today = round((completed_habits_today / active_habits_count * 100), 1) if active_habits_count > 0 else 0.0

        # 4. Fitness
        workout_today = self.db.query(Workout).filter(
            Workout.user_id == self.user.id, Workout.date == today
        ).first()

        workouts_this_week = self.db.query(func.count(Workout.id)).filter(
            Workout.user_id == self.user.id, Workout.date >= seven_days_ago
        ).scalar() or 0

        # 5. Finance (this month)
        month_income = self.db.query(func.coalesce(func.sum(Transaction.amount), 0.0))\
            .filter(
                Transaction.user_id == self.user.id,
                Transaction.transaction_type == "income",
                Transaction.date >= first_day_of_month
            ).scalar()

        month_expense = self.db.query(func.coalesce(func.sum(Transaction.amount), 0.0))\
            .filter(
                Transaction.user_id == self.user.id,
                Transaction.transaction_type == "expense",
                Transaction.date >= first_day_of_month
            ).scalar()

        # 6. Goals
        active_goals = self.db.query(func.count(Goal.id)).filter(
            Goal.user_id == self.user.id, Goal.status == "active"
        ).scalar() or 0

        # 7. XP and Level
        current_level_base = (self.user.level - 1) * 100
        xp_in_level = max(0, self.user.xp - current_level_base)

        return {
            "date": str(today),
            "study_hours_today": round(study_today_min / 60.0, 1),
            "study_hours_week": round(study_week_min / 60.0, 1),
            "tasks_completed_today": completed_today_tasks,
            "tasks_pending": pending_tasks,
            "habits_completed_today": completed_habits_today,
            "habits_total": active_habits_count,
            "habits_rate_today": habit_rate_today,
            "workout_done_today": workout_today is not None,
            "workouts_this_week": workouts_this_week,
            "month_income": round(month_income, 2),
            "month_expense": round(month_expense, 2),
            "month_savings": round(month_income - month_expense, 2),
            "currency": self.user.currency or "NPR",
            "xp": self.user.xp,
            "level": self.user.level,
            "xp_in_level": xp_in_level,
            "xp_target": 100,
            "level_progress_percent": min(100, xp_in_level),
            "active_goals": active_goals,
        }

    def get_weekly_activity(self) -> Dict[str, Any]:
        """7-day breakdown across study hours, workout duration, and tasks completed."""
        today = date.today()
        days_data = []

        for i in range(6, -1, -1):
            d = today - timedelta(days=i)
            d_str = str(d)
            weekday_str = d.strftime("%a")

            # Study hours
            study_min = self.db.query(func.coalesce(func.sum(StudySession.duration_minutes), 0))\
                .filter(StudySession.user_id == self.user.id, StudySession.date == d).scalar()

            # Workout mins
            workout_min = self.db.query(func.coalesce(func.sum(Workout.duration_minutes), 0))\
                .filter(Workout.user_id == self.user.id, Workout.date == d).scalar()

            # Tasks done
            tasks_done = self.db.query(func.count(Task.id)).filter(
                Task.user_id == self.user.id,
                Task.status == "completed",
                func.date(Task.completed_at) == d
            ).scalar() or 0

            days_data.append({
                "date": d_str,
                "day": weekday_str,
                "study_hours": round(study_min / 60.0, 2),
                "workout_minutes": workout_min,
                "tasks_completed": tasks_done,
            })

        return {
            "labels": [item["day"] for item in days_data],
            "dates": [item["date"] for item in days_data],
            "study_hours": [item["study_hours"] for item in days_data],
            "workout_minutes": [item["workout_minutes"] for item in days_data],
            "tasks_completed": [item["tasks_completed"] for item in days_data],
        }

    def get_cross_module_correlations(self) -> List[Dict[str, Any]]:
        """Identify meaningful patterns across modules (e.g. study vs workout days)."""
        today = date.today()
        start = today - timedelta(days=29)

        # Collect day-by-day flags
        study_days = {
            s.date for s in self.db.query(StudySession.date)
            .filter(StudySession.user_id == self.user.id, StudySession.date >= start).all()
        }
        workout_days = {
            w.date for w in self.db.query(Workout.date)
            .filter(Workout.user_id == self.user.id, Workout.date >= start).all()
        }

        insights = []
        total_days = 30
        workout_count = len(workout_days)
        study_count = len(study_days)

        if workout_count >= 5 and study_count >= 5:
            overlap = len(study_days.intersection(workout_days))
            overlap_pct = round((overlap / workout_count) * 100, 1)
            insights.append({
                "type": "study_fitness",
                "title": "Workout & Study Synergy",
                "description": f"On {overlap_pct}% of the days you worked out, you also completed study sessions.",
                "significance": "high" if overlap_pct >= 50 else "neutral",
            })

        # Habit streak check
        habits = self.db.query(Habit).filter(Habit.user_id == self.user.id, Habit.is_active == True).all()
        if habits:
            consistent_count = 0
            for h in habits:
                completions = self.db.query(func.count(HabitCompletion.id)).filter(
                    HabitCompletion.habit_id == h.id,
                    HabitCompletion.date >= start,
                    HabitCompletion.completed == True
                ).scalar() or 0
                if completions >= 20:
                    consistent_count += 1
            if consistent_count > 0:
                insights.append({
                    "type": "habit_mastery",
                    "title": "High Habit Discipline",
                    "description": f"You have {consistent_count} habit(s) with over 65% consistency over the last 30 days.",
                    "significance": "high",
                })

        return insights
