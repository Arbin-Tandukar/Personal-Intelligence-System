"""AI Personal Assistant Service – analyzes real database metrics to answer natural queries."""

from datetime import date, timedelta
from typing import Dict, Any, List
import json
import httpx
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..config import settings
from ..models.user import User
from ..models.study import StudySession, Subject
from ..models.fitness import Workout, Exercise
from ..models.habits import Habit, HabitCompletion
from ..models.finance import Transaction
from ..models.tasks import Task
from ..models.goals import Goal


class AIAssistantService:
    """Provides conversational intelligence grounded in real user database records."""

    def __init__(self, db: Session, user: User):
        self.db = db
        self.user = user

    def gather_user_context(self) -> Dict[str, Any]:
        """Collect factual statistics across all authorized modules for the user."""
        today = date.today()
        seven_days_ago = today - timedelta(days=7)
        thirty_days_ago = today - timedelta(days=30)
        first_of_month = today.replace(day=1)

        # 1. Study facts
        week_study_min = self.db.query(func.coalesce(func.sum(StudySession.duration_minutes), 0))\
            .filter(StudySession.user_id == self.user.id, StudySession.date >= seven_days_ago).scalar() or 0

        subjects = self.db.query(Subject).filter(Subject.user_id == self.user.id).all()
        sub_breakdown = {}
        for s in subjects:
            m = self.db.query(func.coalesce(func.sum(StudySession.duration_minutes), 0))\
                .filter(StudySession.subject_id == s.id, StudySession.user_id == self.user.id, StudySession.date >= seven_days_ago).scalar() or 0
            if m > 0:
                sub_breakdown[s.name] = round(m / 60.0, 1)

        # 2. Habit facts
        habits = self.db.query(Habit).filter(Habit.user_id == self.user.id, Habit.is_active == True).all()
        habit_stats = []
        for h in habits:
            comp_count = self.db.query(func.count(HabitCompletion.id)).filter(
                HabitCompletion.habit_id == h.id,
                HabitCompletion.date >= thirty_days_ago,
                HabitCompletion.completed == True
            ).scalar() or 0
            pct = round((comp_count / 30.0) * 100, 1)
            habit_stats.append(f"{h.name}: {comp_count}/30 days ({pct}%)")

        # 3. Fitness facts
        month_workouts = self.db.query(Workout).filter(
            Workout.user_id == self.user.id,
            Workout.date >= thirty_days_ago
        ).all()
        workout_types = {}
        total_fit_min = 0
        for w in month_workouts:
            workout_types[w.workout_type] = workout_types.get(w.workout_type, 0) + 1
            total_fit_min += w.duration_minutes

        prs = self.db.query(Exercise).join(Workout).filter(
            Workout.user_id == self.user.id,
            Exercise.is_personal_record == True
        ).all()

        # 4. Finance facts
        month_txs = self.db.query(Transaction).filter(
            Transaction.user_id == self.user.id,
            Transaction.date >= first_of_month
        ).all()
        income = sum(t.amount for t in month_txs if t.transaction_type == "income")
        expense = sum(t.amount for t in month_txs if t.transaction_type == "expense")
        cat_expenses = {}
        for t in month_txs:
            if t.transaction_type == "expense":
                cat_expenses[t.category] = cat_expenses.get(t.category, 0.0) + t.amount
        top_expense_category = max(cat_expenses.items(), key=lambda x: x[1])[0] if cat_expenses else "None"

        # 5. Task facts
        completed_tasks = self.db.query(Task).filter(
            Task.user_id == self.user.id,
            Task.status == "completed"
        ).order_by(Task.completed_at.desc()).limit(10).all()
        pending_tasks = self.db.query(Task).filter(
            Task.user_id == self.user.id,
            Task.status != "completed"
        ).all()

        # 6. Goals
        active_goals = self.db.query(Goal).filter(
            Goal.user_id == self.user.id,
            Goal.status == "active"
        ).all()

        return {
            "user": {
                "name": self.user.username,
                "level": self.user.level,
                "xp": self.user.xp,
                "currency": self.user.currency or "NPR",
            },
            "study": {
                "week_hours": round(week_study_min / 60.0, 1),
                "subject_breakdown_hours": sub_breakdown,
            },
            "habits": habit_stats,
            "fitness": {
                "month_workout_count": len(month_workouts),
                "total_duration_minutes": total_fit_min,
                "workout_types": workout_types,
                "pr_count": len(prs),
            },
            "finance": {
                "month_income": income,
                "month_expense": expense,
                "net_savings": income - expense,
                "top_expense_category": top_expense_category,
                "expenses_by_category": cat_expenses,
            },
            "tasks": {
                "recent_completed": [t.title for t in completed_tasks],
                "pending_count": len(pending_tasks),
                "pending_titles": [t.title for t in pending_tasks[:5]],
            },
            "goals": [f"{g.title} ({g.module}): {g.current_value}/{g.target_value or 'N/A'} {g.unit or ''}" for g in active_goals]
        }

    async def answer_query(self, user_prompt: str) -> Dict[str, Any]:
        """Respond to user question using factual database context."""
        context = self.gather_user_context()
        prompt_lower = user_prompt.lower()

        # If external AI API Key is configured, attempt call
        if settings.AI_API_KEY:
            try:
                system_instruction = (
                    "You are the Personal Intelligence System AI assistant. "
                    "Answer the user's question accurately and concisely based strictly on their real personal data provided below. "
                    "Never invent records or assume statistics that are not present. "
                    f"User Data: {json.dumps(context)}"
                )
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        f"{settings.AI_API_URL}/models/{settings.AI_MODEL}:generateContent?key={settings.AI_API_KEY}",
                        json={
                            "contents": [
                                {"role": "user", "parts": [{"text": f"{system_instruction}\n\nQuestion: {user_prompt}"}]}
                            ]
                        }
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            answer = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                            if answer:
                                return {"reply": answer, "mode": "ai_api", "context_used": True}
            except Exception:
                pass  # Fall back gracefully to local intelligence engine

        # High-precision local intelligence engine
        currency = context["user"]["currency"]

        if "study" in prompt_lower or "hours" in prompt_lower:
            hours = context["study"]["week_hours"]
            breakdown = context["study"]["subject_breakdown_hours"]
            reply = f"You studied for **{hours} hours** over the past 7 days."
            if breakdown:
                details = ", ".join([f"{k}: {v}h" for k, v in breakdown.items()])
                reply += f" Breakdown by subject: {details}."
            else:
                reply += " No specific subject study sessions were logged during this period."
            return {"reply": reply, "mode": "local_engine"}

        if "habit" in prompt_lower or "consistent" in prompt_lower:
            habits = context["habits"]
            if habits:
                reply = "Here is your 30-day habit consistency report:\n\n" + "\n".join([f"• {h}" for h in habits])
            else:
                reply = "You haven't logged any active habits yet. Add some in the Habits module to start tracking your streaks!"
            return {"reply": reply, "mode": "local_engine"}

        if "workout" in prompt_lower or "fitness" in prompt_lower or "exercise" in prompt_lower:
            fit = context["fitness"]
            reply = f"This month you completed **{fit['month_workout_count']} workouts** totaling **{fit['total_duration_minutes']} minutes**."
            if fit["workout_types"]:
                types_str = ", ".join([f"{k} ({v})" for k, v in fit["workout_types"].items()])
                reply += f" Types: {types_str}."
            if fit["pr_count"] > 0:
                reply += f" You currently have **{fit['pr_count']} Personal Records** recorded!"
            return {"reply": reply, "mode": "local_engine"}

        if "money" in prompt_lower or "finance" in prompt_lower or "spend" in prompt_lower or "expense" in prompt_lower:
            fin = context["finance"]
            reply = (
                f"This month's financial summary:\n"
                f"• Income: **{currency} {fin['month_income']:,.2f}**\n"
                f"• Expenses: **{currency} {fin['month_expense']:,.2f}**\n"
                f"• Net Savings: **{currency} {fin['net_savings']:,.2f}**\n"
            )
            if fin["top_expense_category"] != "None":
                reply += f"Most of your spending went to **{fin['top_expense_category']}** ({currency} {fin['expenses_by_category'].get(fin['top_expense_category'], 0):,.2f})."
            return {"reply": reply, "mode": "local_engine"}

        if "task" in prompt_lower or "completed" in prompt_lower:
            tasks = context["tasks"]
            completed = tasks["recent_completed"]
            pending = tasks["pending_count"]
            reply = f"You have **{len(completed)} recently completed tasks** and **{pending} pending tasks**."
            if completed:
                reply += "\n\nRecent completions:\n" + "\n".join([f"✓ {t}" for t in completed[:5]])
            if tasks["pending_titles"]:
                reply += "\n\nNext pending tasks:\n" + "\n".join([f"○ {t}" for t in tasks["pending_titles"]])
            return {"reply": reply, "mode": "local_engine"}

        if "improve" in prompt_lower or "recommend" in prompt_lower or "routine" in prompt_lower:
            recommendations = []
            if context["study"]["week_hours"] < 5:
                recommendations.append("Consider scheduling dedicated 25-minute Pomodoro study blocks to increase your weekly study hours.")
            if context["fitness"]["month_workout_count"] < 8:
                recommendations.append("Aim for at least 3 physical workouts per week to maintain fitness momentum.")
            if context["tasks"]["pending_count"] > 5:
                recommendations.append("You have several pending tasks; prioritize the top 2 urgent items today to earn XP.")
            if not recommendations:
                recommendations.append("Your metrics are well-balanced! Maintain your habit consistency and review your monthly budget.")
            reply = "Here are data-backed suggestions for your routine:\n\n" + "\n".join([f"💡 {r}" for r in recommendations])
            return {"reply": reply, "mode": "local_engine"}

        # Default multi-module summary
        return {
            "reply": (
                f"Hello {context['user']['name']} (Level {context['user']['level']})! Here is a summary of your system:\n"
                f"• Study: **{context['study']['week_hours']} hrs** this week\n"
                f"• Fitness: **{context['fitness']['month_workout_count']} workouts** this month\n"
                f"• Finances: **{currency} {context['finance']['net_savings']:,.2f}** net savings this month\n"
                f"• Tasks: **{context['tasks']['pending_count']} pending**\n\n"
                "You can ask me detailed questions about your study hours, workouts, expenses, habits, or routine recommendations."
            ),
            "mode": "local_engine",
        }
