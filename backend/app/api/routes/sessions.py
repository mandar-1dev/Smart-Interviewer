from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, timezone
from app.db.database import get_db
from app.models.session import InterviewSession, UserAnswer, AIFeedback, SessionStatus
from app.models.question import Question
from app.schemas.session import (
    SessionCreate, SessionResponse, AnswerSubmit,
    AnswerResponse, SessionDetailResponse, NextQuestionResponse,
)
from app.services.auth_deps import get_current_user
from app.services.gemini import evaluate_answer
from app.models.user import User
import random

router = APIRouter(prefix="/sessions", tags=["Interview Sessions"])

QUESTIONS_PER_SESSION = 5


@router.post("", response_model=SessionResponse, status_code=201)
async def create_session(
    payload: SessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = InterviewSession(
        user_id=current_user.id,
        category=payload.category,
        difficulty=payload.difficulty,
        total_questions=QUESTIONS_PER_SESSION,
    )
    db.add(session)
    await db.flush()
    await db.refresh(session)
    return session


@router.get("", response_model=List[SessionResponse])
async def list_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
):
    result = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.user_id == current_user.id)
        .order_by(InterviewSession.started_at.desc())
        .offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.get("/{session_id}", response_model=SessionDetailResponse)
async def get_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(InterviewSession)
        .options(
            selectinload(InterviewSession.answers)
            .selectinload(UserAnswer.feedback),
            selectinload(InterviewSession.answers)
            .selectinload(UserAnswer.question),
        )
        .where(InterviewSession.id == session_id, InterviewSession.user_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get("/{session_id}/next-question", response_model=NextQuestionResponse)
async def get_next_question(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.id == session_id, InterviewSession.user_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != SessionStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Session is not in progress")

    # Get already-answered question IDs
    answered = await db.execute(
        select(UserAnswer.question_id).where(UserAnswer.session_id == session_id)
    )
    answered_ids = [row[0] for row in answered.fetchall()]

    # Fetch a random unanswered question from this category/difficulty
    stmt = select(Question).where(
        Question.category == session.category,
        Question.difficulty == session.difficulty,
    )
    if answered_ids:
        stmt = stmt.where(Question.id.not_in(answered_ids))

    questions_result = await db.execute(stmt)
    questions = questions_result.scalars().all()

    if not questions:
        # No more unique questions; end session
        session.status = SessionStatus.COMPLETED
        session.completed_at = datetime.now(timezone.utc)

        # Compute average score
        scores = await db.execute(
            select(func.avg(AIFeedback.score))
            .join(UserAnswer, UserAnswer.id == AIFeedback.answer_id)
            .where(UserAnswer.session_id == session_id)
        )
        session.average_score = scores.scalar() or 0.0
        db.add(session)
        raise HTTPException(status_code=410, detail="Session complete — no more questions")

    question = random.choice(questions)
    return NextQuestionResponse(
        question=question,
        session=session,
        question_number=len(answered_ids) + 1,
        total_questions=session.total_questions,
    )


@router.post("/{session_id}/answers", response_model=AnswerResponse, status_code=201)
async def submit_answer(
    session_id: int,
    payload: AnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate session
    result = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.id == session_id, InterviewSession.user_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != SessionStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Session is not in progress")

    # Validate question
    q_result = await db.execute(select(Question).where(Question.id == payload.question_id))
    question = q_result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Store answer
    user_answer = UserAnswer(
        session_id=session_id,
        question_id=payload.question_id,
        answer_text=payload.answer_text,
    )
    db.add(user_answer)
    await db.flush()

    # Get AI evaluation
    eval_result = await evaluate_answer(
        question=question.content,
        answer=payload.answer_text,
        category=session.category,
        difficulty=session.difficulty,
    )

    feedback = AIFeedback(answer_id=user_answer.id, **eval_result)
    db.add(feedback)

    # Update session progress
    session.completed_questions += 1
    if session.completed_questions >= session.total_questions:
        session.status = SessionStatus.COMPLETED
        session.completed_at = datetime.now(timezone.utc)

        scores = await db.execute(
            select(func.avg(AIFeedback.score))
            .join(UserAnswer, UserAnswer.id == AIFeedback.answer_id)
            .where(UserAnswer.session_id == session_id)
        )
        session.average_score = (scores.scalar() or 0.0 + eval_result["score"]) / 2

    db.add(session)
    await db.flush()
    await db.refresh(user_answer)
    await db.refresh(feedback)

    # Reload with relationships
    ans_result = await db.execute(
        select(UserAnswer)
        .options(selectinload(UserAnswer.feedback), selectinload(UserAnswer.question))
        .where(UserAnswer.id == user_answer.id)
    )
    return ans_result.scalar_one()


@router.put("/{session_id}/complete", response_model=SessionResponse)
async def complete_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.id == session_id, InterviewSession.user_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = SessionStatus.COMPLETED
    session.completed_at = datetime.now(timezone.utc)

    scores = await db.execute(
        select(func.avg(AIFeedback.score))
        .join(UserAnswer, UserAnswer.id == AIFeedback.answer_id)
        .where(UserAnswer.session_id == session_id)
    )
    session.average_score = scores.scalar() or 0.0
    db.add(session)
    await db.refresh(session)
    return session
