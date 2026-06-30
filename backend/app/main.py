from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.db.database import create_tables
from app.api.routes import auth, questions, sessions, dashboard, admin, websocket


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables on startup (Alembic handles migrations in production)
    await create_tables()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered interview simulator API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(questions.router, prefix="/api/v1")
app.include_router(sessions.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(websocket.router)


@app.get("/")
async def root():
    return {"message": "AI Interview Simulator API", "version": "1.0.0", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
