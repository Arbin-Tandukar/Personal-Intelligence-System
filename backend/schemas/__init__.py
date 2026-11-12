"""Schemas package – re-exports all schemas for convenient importing."""

from .user import UserCreate, UserLogin, UserUpdate, UserResponse, TokenData, TokenResponse
from .profile import ProfileCreate, ProfileUpdate, ProfileResponse
from .study import (
    SubjectCreate, SubjectUpdate, SubjectResponse,
    StudySessionCreate, StudySessionUpdate, StudySessionResponse,
    ExamResultCreate, ExamResultUpdate, ExamResultResponse,
)
from .fitness import (
    ExerciseCreate, ExerciseUpdate, ExerciseResponse,
    WorkoutCreate, WorkoutUpdate, WorkoutResponse,
)
from .habits import HabitCreate, HabitUpdate, HabitResponse, HabitCompletionCreate, HabitCompletionResponse
from .finance import TransactionCreate, TransactionUpdate, TransactionResponse, BudgetCreate, BudgetUpdate, BudgetResponse
from .tasks import (
    TaskCreate, TaskUpdate, TaskResponse,
    QuestCreate, QuestUpdate, QuestResponse,
    AchievementCreate, AchievementResponse,
)
from .journal import JournalEntryCreate, JournalEntryUpdate, JournalEntryResponse
from .goals import GoalCreate, GoalUpdate, GoalResponse

__all__ = [
    # User
    "UserCreate", "UserLogin", "UserUpdate", "UserResponse", "TokenData", "TokenResponse",
    # Profile
    "ProfileCreate", "ProfileUpdate", "ProfileResponse",
    # Study
    "SubjectCreate", "SubjectUpdate", "SubjectResponse",
    "StudySessionCreate", "StudySessionUpdate", "StudySessionResponse",
    "ExamResultCreate", "ExamResultUpdate", "ExamResultResponse",
    # Fitness
    "ExerciseCreate", "ExerciseUpdate", "ExerciseResponse",
    "WorkoutCreate", "WorkoutUpdate", "WorkoutResponse",
    # Habits
    "HabitCreate", "HabitUpdate", "HabitResponse",
    "HabitCompletionCreate", "HabitCompletionResponse",
    # Finance
    "TransactionCreate", "TransactionUpdate", "TransactionResponse",
    "BudgetCreate", "BudgetUpdate", "BudgetResponse",
    # Tasks
    "TaskCreate", "TaskUpdate", "TaskResponse",
    "QuestCreate", "QuestUpdate", "QuestResponse",
    "AchievementCreate", "AchievementResponse",
    # Journal
    "JournalEntryCreate", "JournalEntryUpdate", "JournalEntryResponse",
    # Goals
    "GoalCreate", "GoalUpdate", "GoalResponse",
]
