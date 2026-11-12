"""Seed script to populate Personal Intelligence System with realistic data."""

import uuid
from datetime import date, datetime, timedelta, timezone
from sqlalchemy.orm import Session

from .database import engine, Base, SessionLocal
from .models.user import User
from .models.profile import Profile
from .models.study import Subject, StudySession, ExamResult
from .models.fitness import Workout, Exercise
from .models.habits import Habit, HabitCompletion
from .models.finance import Transaction, Budget
from .models.tasks import Task, Quest, Achievement
from .models.journal import JournalEntry
from .models.goals import Goal
from .auth.utils import get_password_hash


def seed_data():
    """Populate database with sample user and multi-module history."""
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if user already exists
        user = db.query(User).filter(User.username == "demo").first()
        if not user:
            user = User(
                username="demo",
                email="demo@example.com",
                hashed_password=get_password_hash("password123"),
                currency="NPR",
                xp=320,
                level=4,
            )
            db.add(user)
            db.flush()
            print(f"Created demo user: {user.username} (Password: password123)")

        user_id = user.id
        today = date.today()

        # 1. Profile
        profile = db.query(Profile).filter(Profile.user_id == user_id).first()
        if not profile:
            profile = Profile(
                user_id=user_id,
                full_name="Alex Mercer",
                bio="Software Engineer & Knowledge Architect. Optimizing human potential through systems thinking and continuous iteration.",
                skills='["Python", "FastAPI", "Distributed Systems", "Machine Learning", "System Design"]',
                interests='["Cognitive Science", "Astrophysics", "Calisthenics", "Financial Engineering"]',
                goals='["Master Rust and high-performance computing", "Run a half-marathon in under 1h 45m", "Save 40% of monthly net income", "Read 24 deep technical books this year"]',
                milestones='["Graduated with Honors in Computer Science", "Shipped first distributed microservice to production", "Completed first 30-day continuous meditation streak"]',
                notes="Guiding principle: Compound interest applies to knowledge, health, and habits just as powerfully as money.",
            )
            db.add(profile)

        # 2. Study Tracker
        existing_sub = db.query(Subject).filter(Subject.user_id == user_id).first()
        if not existing_sub:
            s1 = Subject(user_id=user_id, name="Machine Learning", category="AI / CS", target_hours=50.0, color="#6c5ce7")
            s2 = Subject(user_id=user_id, name="Distributed Systems", category="Software Eng", target_hours=40.0, color="#00cec9")
            s3 = Subject(user_id=user_id, name="Mathematics & Statistics", category="Theory", target_hours=30.0, color="#00b894")
            s4 = Subject(user_id=user_id, name="System Architecture", category="Engineering", target_hours=25.0, color="#fdcb6e")
            db.add_all([s1, s2, s3, s4])
            db.flush()

            # Sessions across past 7 days
            sessions = [
                StudySession(user_id=user_id, subject_id=s1.id, date=today - timedelta(days=6), duration_minutes=90, topics="Backpropagation & Gradient Descent", notes="Implemented from scratch in NumPy"),
                StudySession(user_id=user_id, subject_id=s2.id, date=today - timedelta(days=5), duration_minutes=60, topics="Raft Consensus Algorithm", notes="Read original paper; mapped leader election"),
                StudySession(user_id=user_id, subject_id=s1.id, date=today - timedelta(days=4), duration_minutes=75, topics="Attention Mechanism & Transformers", notes="Multi-head attention tensor operations"),
                StudySession(user_id=user_id, subject_id=s3.id, date=today - timedelta(days=3), duration_minutes=45, topics="Bayesian Inference & Priors", notes="Solved chapter 3 exercises"),
                StudySession(user_id=user_id, subject_id=s2.id, date=today - timedelta(days=2), duration_minutes=80, topics="Vector Clocks & Distributed Ordering", notes="Causal consistency review"),
                StudySession(user_id=user_id, subject_id=s4.id, date=today - timedelta(days=1), duration_minutes=60, topics="Event Sourcing & CQRS", notes="Designed sample ledger architecture"),
                StudySession(user_id=user_id, subject_id=s1.id, date=today, duration_minutes=90, topics="PyTorch Neural Network Training", notes="Trained classifier on benchmark dataset"),
            ]
            db.add_all(sessions)

            # Exams
            e1 = ExamResult(user_id=user_id, subject_id=s1.id, exam_name="Deep Learning Midterm", date=today - timedelta(days=10), score=94.0, max_score=100.0, notes="Top 5% percentile in cohort")
            e2 = ExamResult(user_id=user_id, subject_id=s2.id, exam_name="Systems Architecture Assessment", date=today - timedelta(days=20), score=88.5, max_score=100.0, notes="Strong on consensus models")
            db.add_all([e1, e2])

        # 3. Fitness Tracker
        existing_workout = db.query(Workout).filter(Workout.user_id == user_id).first()
        if not existing_workout:
            w1 = Workout(user_id=user_id, date=today - timedelta(days=5), workout_type="Strength", duration_minutes=55, calories_burned=420, notes="Upper body hypertrophy focus")
            w2 = Workout(user_id=user_id, date=today - timedelta(days=3), workout_type="Cardio", duration_minutes=40, calories_burned=390, notes="5km tempo run along riverside")
            w3 = Workout(user_id=user_id, date=today - timedelta(days=1), workout_type="Strength", duration_minutes=60, calories_burned=480, notes="Lower body & core session")
            db.add_all([w1, w2, w3])
            db.flush()

            # Exercises
            ex1 = Exercise(workout_id=w1.id, name="Barbell Bench Press", sets=4, reps=8, weight=85.0, is_personal_record=True, notes="New personal record!")
            ex2 = Exercise(workout_id=w1.id, name="Overhead Dumbbell Press", sets=3, reps=10, weight=24.0)
            ex3 = Exercise(workout_id=w2.id, name="Outdoor Run", distance=5.2, duration_seconds=1560, is_personal_record=True, notes="Paced at 5:00/km")
            ex4 = Exercise(workout_id=w3.id, name="Barbell Squat", sets=4, reps=8, weight=110.0, is_personal_record=True)
            db.add_all([ex1, ex2, ex3, ex4])

        # 4. Habit Tracker
        existing_habit = db.query(Habit).filter(Habit.user_id == user_id).first()
        if not existing_habit:
            h1 = Habit(user_id=user_id, name="Read 20+ Pages Technical Literature", category="Learning", frequency="daily", color="#6c5ce7")
            h2 = Habit(user_id=user_id, name="Morning 15-Minute Mobility Routine", category="Health", frequency="daily", color="#00b894")
            h3 = Habit(user_id=user_id, name="Hydrate 3 Liters Clean Water", category="Health", frequency="daily", color="#00cec9")
            h4 = Habit(user_id=user_id, name="Evening Screen-Free Reflection", category="Mindfulness", frequency="daily", color="#fdcb6e")
            db.add_all([h1, h2, h3, h4])
            db.flush()

            # Completions over 14 days
            for d_offset in range(14, -1, -1):
                cur_d = today - timedelta(days=d_offset)
                # h1 completed most days
                if d_offset not in [4, 9]:
                    db.add(HabitCompletion(habit_id=h1.id, date=cur_d, completed=True))
                # h2 completed almost every day
                if d_offset not in [2]:
                    db.add(HabitCompletion(habit_id=h2.id, date=cur_d, completed=True))
                # h3 completed every single day
                db.add(HabitCompletion(habit_id=h3.id, date=cur_d, completed=True))
                # h4 completed regularly
                if d_offset % 2 == 0:
                    db.add(HabitCompletion(habit_id=h4.id, date=cur_d, completed=True))

        # 5. Finance Tracker
        existing_tx = db.query(Transaction).filter(Transaction.user_id == user_id).first()
        if not existing_tx:
            # Income
            db.add(Transaction(user_id=user_id, amount=120000.0, transaction_type="income", category="Engineering Salary", description="Monthly software engineering compensation", date=today.replace(day=1), currency="NPR"))
            db.add(Transaction(user_id=user_id, amount=35000.0, transaction_type="income", category="Consulting", description="System architecture consulting retainer", date=today.replace(day=10), currency="NPR"))

            # Expenses
            db.add(Transaction(user_id=user_id, amount=30000.0, transaction_type="expense", category="Housing", description="Apartment rent & maintenance", date=today.replace(day=2), currency="NPR"))
            db.add(Transaction(user_id=user_id, amount=18500.0, transaction_type="expense", category="Groceries", description="Organic produce and high-protein nutrition", date=today - timedelta(days=7), currency="NPR"))
            db.add(Transaction(user_id=user_id, amount=6200.0, transaction_type="expense", category="Books & Learning", description="O'Reilly books and cloud compute credits", date=today - timedelta(days=4), currency="NPR"))
            db.add(Transaction(user_id=user_id, amount=4500.0, transaction_type="expense", category="Utilities", description="Fiber internet & power", date=today.replace(day=5), currency="NPR"))

            # Budgets
            db.add(Budget(user_id=user_id, category="Housing", amount=32000.0, month=today.month, year=today.year))
            db.add(Budget(user_id=user_id, category="Groceries", amount=25000.0, month=today.month, year=today.year))
            db.add(Budget(user_id=user_id, category="Books & Learning", amount=10000.0, month=today.month, year=today.year))
            db.add(Budget(user_id=user_id, category="Utilities", amount=6000.0, month=today.month, year=today.year))

        # 6. Tasks, Quests, Achievements
        existing_quest = db.query(Quest).filter(Quest.user_id == user_id).first()
        if not existing_quest:
            q1 = Quest(user_id=user_id, title="Deploy Personal Life Command Center", description="Architect, implement, and operate the complete local-first personal intelligence platform", xp_reward=150, status="active")
            db.add(q1)
            db.flush()

            t1 = Task(user_id=user_id, quest_id=q1.id, title="Configure FastAPI and SQLite backend schemas", priority="urgent", status="completed", category="Engineering", xp_reward=25, completed_at=datetime.now(timezone.utc) - timedelta(days=2))
            t2 = Task(user_id=user_id, quest_id=q1.id, title="Design responsive dark cyberpunk UI command center", priority="high", status="completed", category="Design", xp_reward=25, completed_at=datetime.now(timezone.utc) - timedelta(days=1))
            t3 = Task(user_id=user_id, quest_id=q1.id, title="Implement cross-module correlation analytics engine", priority="high", status="pending", category="Engineering", xp_reward=35)
            t4 = Task(user_id=user_id, quest_id=q1.id, title="Integrate grounded AI assistant with database verification", priority="urgent", status="pending", category="AI", xp_reward=40)
            t5 = Task(user_id=user_id, title="Perform weekly financial audit and adjust category budgets", priority="medium", status="pending", category="Finance", xp_reward=15)
            db.add_all([t1, t2, t3, t4, t5])

            # Achievements
            a1 = Achievement(user_id=user_id, title="First Step", description="Completed your very first system objective", icon="fa-check-circle", xp_reward=25, unlocked_at=datetime.now(timezone.utc) - timedelta(days=3))
            a2 = Achievement(user_id=user_id, title="Habitual Master", description="Maintained 7 consecutive days on a healthy habit", icon="fa-fire", xp_reward=50, unlocked_at=datetime.now(timezone.utc) - timedelta(days=1))
            db.add_all([a1, a2])

        # 7. Journal
        existing_journal = db.query(JournalEntry).filter(JournalEntry.user_id == user_id).first()
        if not existing_journal:
            j1 = JournalEntry(
                user_id=user_id,
                title="System Design Reflection: Local-First Autonomy",
                content="Building a personal intelligence system reinforces why local-first data ownership matters. When personal health, academic, and financial metrics live on your own machine, you can freely query, correlate, and analyze without third-party surveillance.\n\nThe real breakthrough comes when your routines are quantified: you notice that morning workouts directly correlate with 25% higher study focus in the afternoon.",
                entry_type="journal",
                category="Philosophy",
                mood="🧘 Focused",
                tags="systems, autonomy, local-first",
                is_pinned=True,
            )
            j2 = JournalEntry(
                user_id=user_id,
                title="Idea: Automated Correlation Matrix for Daily Energy",
                content="What if we correlated sleep quality with deep work duration and workout intensity? A lightweight scoring algorithm could predict peak cognitive hours based on previous week's logged metrics.",
                entry_type="idea",
                category="Productivity",
                mood="💡 Creative",
                tags="ideas, machine-learning, optimization",
            )
            db.add_all([j1, j2])

        # 8. Goals
        existing_goal = db.query(Goal).filter(Goal.user_id == user_id).first()
        if not existing_goal:
            g1 = Goal(user_id=user_id, title="Complete 100 Hours of ML & Distributed Systems Study", module="study", target_value=100.0, current_value=32.5, unit="hours", status="active")
            g2 = Goal(user_id=user_id, title="Bench Press 100kg Personal Record", module="fitness", target_value=100.0, current_value=85.0, unit="kg", status="active")
            g3 = Goal(user_id=user_id, title="Maintain 30-Day Consecutive Reading Streak", module="habits", target_value=30.0, current_value=12.0, unit="days", status="active")
            db.add_all([g1, g2, g3])

        db.commit()
        print("Personal Intelligence System successfully seeded with comprehensive sample data!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
