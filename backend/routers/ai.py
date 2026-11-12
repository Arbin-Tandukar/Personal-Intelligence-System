"""AI Assistant router."""

import re
from pathlib import Path
from typing import Optional
import httpx
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models.user import User
from ..services.ai_service import AIAssistantService
from ..auth.dependencies import get_current_user

router = APIRouter(prefix="/api/ai", tags=["AI Assistant"])


class AIChatRequest(BaseModel):
    message: str = Field(..., min_length=1)


class AIConfigRequest(BaseModel):
    api_key: str = Field(..., min_length=1)
    model: Optional[str] = "gemini-2.0-flash"


@router.post("/chat")
async def chat_with_assistant(
    request: AIChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Ask natural language question about user's own data."""
    service = AIAssistantService(db, current_user)
    result = await service.answer_query(request.message)
    return result


@router.get("/context")
def get_user_data_context(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """View the structured facts authorized for the assistant."""
    service = AIAssistantService(db, current_user)
    return service.gather_user_context()


@router.get("/config")
def get_ai_config(
    current_user: User = Depends(get_current_user),
):
    """Get current AI assistant configuration status."""
    has_key = bool(settings.AI_API_KEY and settings.AI_API_KEY.strip())
    masked = ""
    if has_key:
        k = settings.AI_API_KEY.strip()
        masked = f"{k[:6]}...{k[-4:]}" if len(k) > 10 else "***"

    return {
        "has_key": has_key,
        "masked_key": masked,
        "model": settings.AI_MODEL,
        "provider": "Google Gemini",
    }


@router.post("/config")
async def update_ai_config(
    req: AIConfigRequest,
    current_user: User = Depends(get_current_user),
):
    """Test and update AI API key in memory and .env file."""
    api_key = req.api_key.strip()
    model = req.model.strip() if req.model else "gemini-2.0-flash"

    # Test the API key with a ping to Gemini
    test_url = f"{settings.AI_API_URL}/models/{model}:generateContent?key={api_key}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                test_url,
                json={"contents": [{"role": "user", "parts": [{"text": "Hi"}]}]},
            )
            if resp.status_code != 200:
                err_data = resp.json().get("error", {})
                err_msg = err_data.get("message", f"HTTP {resp.status_code}")
                raise HTTPException(status_code=400, detail=f"Gemini API test failed: {err_msg}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not connect to Gemini API: {str(e)}")

    # Update in runtime settings
    settings.AI_API_KEY = api_key
    settings.AI_MODEL = model

    # Persist to .env file
    env_path = Path(".env")
    if env_path.exists():
        content = env_path.read_text(encoding="utf-8")
        if "AI_API_KEY=" in content:
            content = re.sub(r"AI_API_KEY=.*", f"AI_API_KEY={api_key}", content)
        else:
            content += f"\nAI_API_KEY={api_key}"

        if "AI_MODEL=" in content:
            content = re.sub(r"AI_MODEL=.*", f"AI_MODEL={model}", content)
        else:
            content += f"\nAI_MODEL={model}"

        env_path.write_text(content, encoding="utf-8")

    return {
        "success": True,
        "message": f"Successfully connected to Gemini API with model {model}!",
        "model": model,
        "masked_key": f"{api_key[:6]}...{api_key[-4:]}" if len(api_key) > 10 else "***",
    }

