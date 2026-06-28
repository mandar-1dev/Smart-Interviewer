from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "AI Interview Simulator"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/interview_db"
    SYNC_DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/interview_db"

    # JWT
    SECRET_KEY: str = "changeme-super-secret-key-32-chars-minimum"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Gemini
    GEMINI_API_KEY: str = ""

    # Admin seed
    ADMIN_EMAIL: str = "admin@interview.com"
    ADMIN_PASSWORD: str = "Admin@123456"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
