from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.database import get_db
from app.models.session import InterviewSession, UserAnswer, AIFeedback, SessionStatus
from app.services.auth_deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Total sessions
    total = await db.execute(
        select(func.count()).where(InterviewSession.user_id == current_user.id)
    )
    total_sessions = total.scalar() or 0

    # Completed sessions
    completed = await db.execute(
        select(func.count()).where(
            InterviewSession.user_id == current_user.id,
            InterviewSession.status == SessionStatus.COMPLETED,
        )
    )
    completed_sessions = completed.scalar() or 0

    # Average score across all completed sessions
    avg = await db.execute(
        select(func.avg(AIFeedback.score))
        .join(UserAnswer, UserAnswer.id == AIFeedback.answer_id)
        .join(InterviewSession, InterviewSession.id == UserAnswer.session_id)
        .where(InterviewSession.user_id == current_user.id)
    )
    average_score = round(avg.scalar() or 0.0, 2)

    # Total answers submitted
    ans = await db.execute(
        select(func.count(UserAnswer.id))
        .join(InterviewSession, InterviewSession.id == UserAnswer.session_id)
        .where(InterviewSession.user_id == current_user.id)
    )
    total_answers = ans.scalar() or 0

    # Recent sessions (last 5)
    recent = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.user_id == current_user.id)
        .order_by(InterviewSession.started_at.desc())
        .limit(5)
    )
    recent_sessions = recent.scalars().all()

    return {
        "total_sessions": total_sessions,
        "completed_sessions": completed_sessions,
        "average_score": average_score,
        "total_answers": total_answers,
        "recent_sessions": [
            {
                "id": s.id,
                "category": s.category,
                "difficulty": s.difficulty,
                "status": s.status,
                "average_score": s.average_score,
                "started_at": s.started_at,
                "completed_at": s.completed_at,
            }
            for s in recent_sessions
        ],
    }
