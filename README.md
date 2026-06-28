# 🧠 InterviewAI — AI-Powered Interview Simulator

A full-stack AI interview simulator that lets users practice software engineering interviews, receive real-time AI feedback powered by Google Gemini, and track their progress over time.

> Built with FastAPI · React · PostgreSQL · Google Gemini · Docker

---

## ✨ Features

- **9 Interview Categories** — DSA, OOP, DBMS, OS, CN, Python, Java, C++, Behavioral
- **3 Difficulty Levels** — Easy, Medium, Hard
- **AI Evaluation** — Every answer is scored by Gemini with structured feedback:
  - Score (0–10), Technical Accuracy, Communication Quality
  - Strengths, Weaknesses, Missing Concepts
  - Ideal Answer, Topics to Study
- **Interview History** — Review all past sessions and feedback
- **Admin Panel** — Add/edit/delete questions, view users and platform stats
- **JWT Authentication** — Secure register, login, and role-based access
- **WebSocket Support** — Real-time interview session connectivity
- **Fully Dockerised** — Run with one command

---

## 🛠️ Tech Stack

| Layer      | Technology                                  |
|------------|----------------------------------------------|
| Backend    | Python 3.12, FastAPI, SQLAlchemy (async), Alembic |
| Database   | PostgreSQL 16                                |
| AI         | Google Gemini 2.0 Flash                     |
| Frontend   | React 18, Vite, Tailwind CSS, React Router v6 |
| Auth       | JWT (python-jose), bcrypt                   |
| Deploy     | Docker, Docker Compose, Nginx               |

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Google Gemini API key ([get one free](https://aistudio.google.com/))

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/ai-interview-simulator.git
cd ai-interview-simulator
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
GEMINI_API_KEY=your-gemini-api-key-here
SECRET_KEY=your-random-secret-key-min-32-chars
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourAdmin@123
```

### 3. Start the stack

```bash
docker compose up --build
```

### 4. Seed the database

```bash
docker exec interview_backend python -m app.db.seed
```

### 5. Open in browser

| Service  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:3000       |
| API Docs | http://localhost:8000/docs  |
| Backend  | http://localhost:8000       |

---

## 💻 Local Development (Without Docker)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set up .env, then:
python -m uvicorn app.main:app --reload --port 8000
python -m app.db.seed             # seed DB + create admin
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

---

## 📁 Project Structure

```
ai-interview-simulator/
├── backend/
│   ├── app/
│   │   ├── api/routes/         # auth, questions, sessions, dashboard, admin, websocket
│   │   ├── core/               # config, security (JWT + bcrypt)
│   │   ├── db/                 # database setup, seed script
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic v2 schemas
│   │   ├── services/           # Gemini AI service, auth dependencies
│   │   └── main.py             # FastAPI app entry point
│   ├── alembic/                # Database migrations
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/         # Navbar, ProtectedRoute
│   │   ├── hooks/              # useAuth (AuthContext)
│   │   ├── pages/              # Login, Register, Dashboard, Interview, Report, History, Admin
│   │   └── services/           # Axios API client
│   ├── Dockerfile
│   ├── nginx.conf
│   └── vite.config.js
└── docker-compose.yml
```

---

## 🔑 Default Credentials

| Role  | Email                   | Password      |
|-------|-------------------------|---------------|
| Admin | admin@interview.com     | Admin@123456  |
| User  | Register on /register   | —             |

---

## 📡 API Reference

Full interactive docs at **http://localhost:8000/docs**

| Method | Endpoint                            | Description              |
|--------|-------------------------------------|--------------------------|
| POST   | /api/v1/auth/register               | Create account           |
| POST   | /api/v1/auth/login                  | Login → JWT token        |
| GET    | /api/v1/auth/me                     | Get current user         |
| GET    | /api/v1/questions                   | List questions           |
| POST   | /api/v1/sessions                    | Start interview session  |
| GET    | /api/v1/sessions/{id}/next-question | Get next question        |
| POST   | /api/v1/sessions/{id}/answers       | Submit answer → AI eval  |
| GET    | /api/v1/dashboard/stats             | User statistics          |
| GET    | /api/v1/admin/stats                 | Platform stats (admin)   |
| WS     | /ws/interview/{id}?token=...        | WebSocket connection     |

---

## 🔐 Security

- Passwords hashed with bcrypt
- JWT tokens with configurable expiry
- Role-based access (user / admin)
- All secrets via environment variables — never hardcoded
- Input validation via Pydantic v2

---

## 📄 License

MIT — free to use and modify.
