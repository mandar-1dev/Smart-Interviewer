from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from app.db.database import get_db
from app.models.user import User
from app.models.session import InterviewSession, UserAnswer, AIFeedback, SessionStatus
from app.schemas.user import UserResponse
from app.schemas.session import SessionResponse
from app.services.auth_deps import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(
        select(User).order_by(User.created_at.desc()).offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/users/{user_id}/deactivate", status_code=200)
async def deactivate_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    db.add(user)
    return {"message": "User deactivated"}


@router.get("/sessions", response_model=List[SessionResponse])
async def list_all_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(
        select(InterviewSession)
        .order_by(InterviewSession.started_at.desc())
        .offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.get("/stats")
async def admin_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    total_sessions = (await db.execute(select(func.count(InterviewSession.id)))).scalar() or 0
    completed = (await db.execute(
        select(func.count(InterviewSession.id))
        .where(InterviewSession.status == SessionStatus.COMPLETED)
    )).scalar() or 0
    avg_score = (await db.execute(select(func.avg(AIFeedback.score)))).scalar() or 0.0

    return {
        "total_users": total_users,
        "total_sessions": total_sessions,
        "completed_sessions": completed,
        "platform_average_score": round(avg_score, 2),
    }
