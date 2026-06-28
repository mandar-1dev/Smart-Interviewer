from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from app.db.database import get_db
from app.models.question import Question, Category, Difficulty
from app.schemas.question import QuestionCreate, QuestionUpdate, QuestionResponse, QuestionDetailResponse
from app.services.auth_deps import get_current_user, get_current_admin
from app.models.user import User

router = APIRouter(prefix="/questions", tags=["Questions"])


@router.get("/categories", response_model=List[str])
async def get_categories():
    return [c.value for c in Category]


@router.get("/difficulties", response_model=List[str])
async def get_difficulties():
    return [d.value for d in Difficulty]


@router.get("", response_model=List[QuestionResponse])
async def list_questions(
    category: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    stmt = select(Question)
    if category:
        stmt = stmt.where(Question.category == category)
    if difficulty:
        stmt = stmt.where(Question.difficulty == difficulty)
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{question_id}", response_model=QuestionDetailResponse)
async def get_question(
    question_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Question).where(Question.id == question_id))
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return q


# Admin-only endpoints
@router.post("", response_model=QuestionResponse, status_code=201)
async def create_question(
    payload: QuestionCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    question = Question(**payload.model_dump())
    db.add(question)
    await db.flush()
    await db.refresh(question)
    return question


@router.put("/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: int,
    payload: QuestionUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(select(Question).where(Question.id == question_id))
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(q, field, value)
    db.add(q)
    await db.refresh(q)
    return q


@router.delete("/{question_id}", status_code=204)
async def delete_question(
    question_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(select(Question).where(Question.id == question_id))
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    await db.delete(q)
