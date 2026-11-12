"""Finance router for Transactions, Budgets, and Financial Summaries."""

from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models.user import User
from ..models.finance import Transaction, Budget
from ..schemas.finance import (
    TransactionCreate, TransactionUpdate, TransactionResponse,
    BudgetCreate, BudgetUpdate, BudgetResponse
)
from ..auth.dependencies import get_current_user

router = APIRouter(prefix="/api/finance", tags=["Finance Tracker"])


# ── Transactions ─────────────────────────────────────────────────────────────

@router.get("/transactions", response_model=List[TransactionResponse])
def get_transactions(
    transaction_type: Optional[str] = None,
    category: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List transactions with optional filters."""
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    if transaction_type:
        query = query.filter(Transaction.transaction_type == transaction_type)
    if category:
        query = query.filter(Transaction.category == category)
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    return query.order_by(Transaction.date.desc(), Transaction.created_at.desc()).all()


@router.post("/transactions", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    data: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Record a financial transaction."""
    tx_data = data.model_dump()
    if not tx_data.get("currency"):
        tx_data["currency"] = current_user.currency or "NPR"

    tx = Transaction(**tx_data, user_id=current_user.id)
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


@router.put("/transactions/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: str,
    data: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a transaction."""
    tx = db.query(Transaction).filter(Transaction.id == transaction_id, Transaction.user_id == current_user.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(tx, key, value)
    db.commit()
    db.refresh(tx)
    return tx


@router.delete("/transactions/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a transaction."""
    tx = db.query(Transaction).filter(Transaction.id == transaction_id, Transaction.user_id == current_user.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(tx)
    db.commit()
    return None


# ── Budgets ──────────────────────────────────────────────────────────────────

@router.get("/budgets", response_model=List[BudgetResponse])
def get_budgets(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List budgets for current user."""
    today = date.today()
    target_month = month or today.month
    target_year = year or today.year

    return db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month == target_month,
        Budget.year == target_year,
    ).all()


@router.post("/budgets", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_budget(
    data: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create or update monthly category budget."""
    existing = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category == data.category,
        Budget.month == data.month,
        Budget.year == data.year,
    ).first()

    if existing:
        existing.amount = data.amount
        db.commit()
        db.refresh(existing)
        return existing

    budget = Budget(**data.model_dump(), user_id=current_user.id)
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


@router.delete("/budgets/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a budget."""
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    db.delete(budget)
    db.commit()
    return None


# ── Finance Summary ──────────────────────────────────────────────────────────

@router.get("/summary")
def get_finance_summary(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Calculate total income, expenses, net savings, budget vs actual comparisons."""
    today = date.today()
    target_month = month or today.month
    target_year = year or today.year

    # Filter transactions for this month/year
    all_txs = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        func.extract("month", Transaction.date) == target_month,
        func.extract("year", Transaction.date) == target_year,
    ).all()

    total_income = sum(t.amount for t in all_txs if t.transaction_type == "income")
    total_expense = sum(t.amount for t in all_txs if t.transaction_type == "expense")
    net_savings = total_income - total_expense

    # Category breakdown for expenses
    cat_expenses = {}
    for t in all_txs:
        if t.transaction_type == "expense":
            cat_expenses[t.category] = cat_expenses.get(t.category, 0.0) + t.amount

    # Budgets for this month
    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month == target_month,
        Budget.year == target_year,
    ).all()

    budget_status = []
    for b in budgets:
        spent = cat_expenses.get(b.category, 0.0)
        remaining = b.amount - spent
        percent_used = round((spent / b.amount) * 100, 1) if b.amount > 0 else 0
        budget_status.append({
            "id": b.id,
            "category": b.category,
            "budgeted": b.amount,
            "spent": spent,
            "remaining": remaining,
            "percent_used": percent_used,
            "is_over": spent > b.amount
        })

    return {
        "month": target_month,
        "year": target_year,
        "currency": current_user.currency or "NPR",
        "total_income": total_income,
        "total_expense": total_expense,
        "net_savings": net_savings,
        "expense_by_category": cat_expenses,
        "budget_status": budget_status,
    }
