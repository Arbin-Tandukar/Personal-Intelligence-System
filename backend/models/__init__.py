"""Models package – import all models so they register with the Base."""

from .user import User
from .profile import Profile
from .study import Subject, StudySession, ExamResult
from .fitness import Workout, Exercise
from .habits import Habit, HabitCompletion
from .finance import Transaction, Budget
from .tasks import Task, Quest, Achievement
from .journal import JournalEntry
from .goals import Goal

__all__ = [
    "User",
    "Profile",
    "Subject",
    "StudySession",
    "ExamResult",
    "Workout",
    "Exercise",
    "Habit",
    "HabitCompletion",
    "Transaction",
    "Budget",
    "Task",
    "Quest",
    "Achievement",
    "JournalEntry",
    "Goal",
]
