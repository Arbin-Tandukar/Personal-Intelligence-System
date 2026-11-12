"""Routers package – re-exports all API routers."""

from ..auth.router import router as auth_router
from .profile import router as profile_router
from .study import router as study_router
from .fitness import router as fitness_router
from .habits import router as habits_router
from .finance import router as finance_router
from .tasks import router as tasks_router
from .journal import router as journal_router
from .goals import router as goals_router
from .analytics import router as analytics_router
from .ai import router as ai_router
from .backup import router as backup_router

__all__ = [
    "auth_router",
    "profile_router",
    "study_router",
    "fitness_router",
    "habits_router",
    "finance_router",
    "tasks_router",
    "journal_router",
    "goals_router",
    "analytics_router",
    "ai_router",
    "backup_router",
]
