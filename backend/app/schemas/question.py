from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.question import Category, Difficulty


class QuestionCreate(BaseModel):
    title: str
    content: str
    category: Category
    difficulty: Difficulty
    sample_answer: Optional[str] = None


class QuestionUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[Category] = None
    difficulty: Optional[Difficulty] = None
    sample_answer: Optional[str] = None


class QuestionResponse(BaseModel):
    id: int
    title: str
    content: str
    category: Category
    difficulty: Difficulty
    created_at: datetime

    model_config = {"from_attributes": True}


class QuestionDetailResponse(QuestionResponse):
    sample_answer: Optional[str] = None
