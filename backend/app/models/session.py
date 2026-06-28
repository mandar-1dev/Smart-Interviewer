from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime, Enum as SAEnum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class SessionStatus(str, enum.Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(100), nullable=False)
    difficulty = Column(String(20), nullable=False)
    status = Column(SAEnum(SessionStatus), default=SessionStatus.IN_PROGRESS, nullable=False)
    total_questions = Column(Integer, default=0)
    completed_questions = Column(Integer, default=0)
    average_score = Column(Float, nullable=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="sessions")
    answers = relationship("UserAnswer", back_populates="session", cascade="all, delete-orphan")


class UserAnswer(Base):
    __tablename__ = "user_answers"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False, index=True)
    answer_text = Column(Text, nullable=False)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    session = relationship("InterviewSession", back_populates="answers")
    question = relationship("Question", back_populates="answers")
    feedback = relationship("AIFeedback", back_populates="answer", uselist=False, cascade="all, delete-orphan")


class AIFeedback(Base):
    __tablename__ = "ai_feedback"

    id = Column(Integer, primary_key=True, index=True)
    answer_id = Column(Integer, ForeignKey("user_answers.id", ondelete="CASCADE"), unique=True, nullable=False)
    score = Column(Float, nullable=False)
    technical_accuracy = Column(Text, nullable=False)
    communication_quality = Column(Text, nullable=False)
    missing_concepts = Column(JSON, nullable=True)   # list of strings
    strengths = Column(JSON, nullable=True)           # list of strings
    weaknesses = Column(JSON, nullable=True)          # list of strings
    suggested_improvements = Column(Text, nullable=False)
    ideal_answer = Column(Text, nullable=False)
    topics_to_study = Column(JSON, nullable=True)     # list of strings
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    answer = relationship("UserAnswer", back_populates="feedback")
