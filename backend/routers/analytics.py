"""Analytics router exposing comprehensive statistics and reports."""

from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..services.analytics import AnalyticsEngine
from ..auth.dependencies import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics Engine"])


@router.get("/dashboard")
def get_dashboard_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve all high-level stats needed by the main dashboard."""
    engine = AnalyticsEngine(db, current_user)
    summary = engine.get_dashboard_summary()
    weekly_activity = engine.get_weekly_activity()
    return {
        "summary": summary,
        "weekly_activity": weekly_activity,
    }


@router.get("/report")
def get_full_report(
    period: str = "weekly",  # daily, weekly, monthly
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate in-depth multi-module report with correlation insights."""
    engine = AnalyticsEngine(db, current_user)
    summary = engine.get_dashboard_summary()
    correlations = engine.get_cross_module_correlations()
    weekly_activity = engine.get_weekly_activity()

    return {
        "period": period,
        "summary": summary,
        "correlations": correlations,
        "weekly_activity": weekly_activity,
    }
