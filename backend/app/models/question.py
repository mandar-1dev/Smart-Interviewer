from sqlalchemy import Column, Integer, String, Text, Enum as SAEnum, DateTime, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class Category(str, enum.Enum):
    DSA = "Data Structures & Algorithms"
    OOP = "Object-Oriented Programming"
    DBMS = "DBMS"
    OS = "Operating Systems"
    CN = "Computer Networks"
    PYTHON = "Python"
    JAVA = "Java"
    CPP = "C++"
    BEHAVIORAL = "Behavioral Interview"


class Difficulty(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(SAEnum(Category), nullable=False, index=True)
    difficulty = Column(SAEnum(Difficulty), nullable=False, index=True)
    sample_answer = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    answers = relationship("UserAnswer", back_populates="question")

    __table_args__ = (
        Index("ix_questions_category_difficulty", "category", "difficulty"),
    )
