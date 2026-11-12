"""Profile router."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..models.profile import Profile
from ..schemas.profile import ProfileResponse, ProfileUpdate
from ..auth.dependencies import get_current_user

router = APIRouter(prefix="/api/profile", tags=["Profile"])


@router.get("", response_model=ProfileResponse)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve profile for the authenticated user, creating one if not exists."""
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        profile = Profile(
            user_id=current_user.id,
            full_name=current_user.username,
            bio="",
            goals="[]",
            interests="[]",
            skills="[]",
            milestones="[]",
            notes="",
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.put("", response_model=ProfileResponse)
def update_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update profile details for the authenticated user."""
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)

    update_dict = profile_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(profile, key, value)

    db.commit()
    db.refresh(profile)
    return profile
