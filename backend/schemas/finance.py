"""Finance schemas: Transaction, Budget."""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ── Transaction ──────────────────────────────────────────────────────────────

class TransactionCreate(BaseModel):
    """Schema for creating a transaction."""

    amount: float = Field(..., gt=0)
    transaction_type: str = Field(..., pattern=r"^(income|expense)$")
    category: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None
    date: date
    currency: str = Field(default="NPR", max_length=10)


class TransactionUpdate(BaseModel):
    """Schema for updating a transaction."""

    amount: Optional[float] = Field(None, gt=0)
    transaction_type: Optional[str] = Field(None, pattern=r"^(income|expense)$")
    category: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = None
    date: Optional[date] = None
    currency: Optional[str] = Field(None, max_length=10)


class TransactionResponse(BaseModel):
    """Schema for transaction response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    amount: float
    transaction_type: str
    category: str
    description: Optional[str] = None
    date: date
    currency: str
    created_at: datetime
    updated_at: datetime


# ── Budget ───────────────────────────────────────────────────────────────────

class BudgetCreate(BaseModel):
    """Schema for creating a budget."""

    category: str = Field(..., min_length=1, max_length=50)
    amount: float = Field(..., gt=0)
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2000, le=2100)


class BudgetUpdate(BaseModel):
    """Schema for updating a budget."""

    category: Optional[str] = Field(None, min_length=1, max_length=50)
    amount: Optional[float] = Field(None, gt=0)
    month: Optional[int] = Field(None, ge=1, le=12)
    year: Optional[int] = Field(None, ge=2000, le=2100)


class BudgetResponse(BaseModel):
    """Schema for budget response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    category: str
    amount: float
    month: int
    year: int
    created_at: datetime
    updated_at: datetime
