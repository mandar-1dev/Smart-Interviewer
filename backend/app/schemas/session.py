from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.session import SessionStatus
from app.schemas.question import QuestionResponse


class SessionCreate(BaseModel):
    category: str
    difficulty: str


class SessionResponse(BaseModel):
    id: int
    user_id: int
    category: str
    difficulty: str
    status: SessionStatus
    total_questions: int
    completed_questions: int
    average_score: Optional[float]
    started_at: datetime
    completed_at: Optional[datetime]

    model_config = {"from_attributes": True}


class AnswerSubmit(BaseModel):
    question_id: int
    answer_text: str


class AIFeedbackResponse(BaseModel):
    id: int
    score: float
    technical_accuracy: str
    communication_quality: str
    missing_concepts: Optional[List[str]]
    strengths: Optional[List[str]]
    weaknesses: Optional[List[str]]
    suggested_improvements: str
    ideal_answer: str
    topics_to_study: Optional[List[str]]
    created_at: datetime

    model_config = {"from_attributes": True}


class AnswerResponse(BaseModel):
    id: int
    session_id: int
    question_id: int
    answer_text: str
    submitted_at: datetime
    feedback: Optional[AIFeedbackResponse]
    question: Optional[QuestionResponse]

    model_config = {"from_attributes": True}


class SessionDetailResponse(SessionResponse):
    answers: List[AnswerResponse] = []


class NextQuestionResponse(BaseModel):
    question: QuestionResponse
    session: SessionResponse
    question_number: int
    total_questions: int
