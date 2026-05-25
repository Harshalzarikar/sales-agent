<div align="center">

# 🦫 Beaver Agent

### Multi-Agent Sales Email Orchestrator

An AI-powered pipeline that automatically classifies inbound emails, researches prospects, drafts personalized responses, and quality-checks them — all through a coordinated team of specialized AI agents.

[![CI/CD Pipeline](https://github.com/Harshalzarikar/Beaver-agent/actions/workflows/ci.yml/badge.svg)](https://github.com/Harshalzarikar/Beaver-agent/actions)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![React 19](https://img.shields.io/badge/react-19-61DAFB.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/fastapi-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![LangGraph](https://img.shields.io/badge/langgraph-0.2+-orange.svg)](https://github.com/langchain-ai/langgraph)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Agent Pipeline](#-agent-pipeline)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Configuration](#%EF%B8%8F-configuration)
- [API Reference](#-api-reference)
- [Frontend](#-frontend)
- [Testing](#-testing)
- [Docker Deployment](#-docker-deployment)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔍 Overview

Beaver Agent is a **production-grade multi-agent system** built with [LangGraph](https://github.com/langchain-ai/langgraph) that automates the sales email response workflow. It orchestrates five specialized AI agents to:

1. **Classify** inbound emails as Leads, Complaints, or Spam
2. **Research** the sender's company using real-time web search
3. **Draft** a personalized, grounded response
4. **Verify** the draft for quality, hallucinations, and tone
5. **Handle complaints** with empathetic support responses

The system features a **React 19 SaaS frontend** with Supabase authentication, a **FastAPI backend** with JWT auth and rate limiting, and full **Docker** containerization for production deployment.

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         React Frontend (Vite)                    │
│  Landing Page → Auth (Supabase) → Dashboard → Email Processor    │
└──────────────────────────┬───────────────────────────────────────┘
                           │ HTTP / JWT
┌──────────────────────────▼───────────────────────────────────────┐
│                      FastAPI Backend                              │
│  CORS · Rate Limiting · API Key Auth · Supabase JWT Verification │
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                   LangGraph Orchestrator                          │
│                                                                   │
│   ┌─────────┐    ┌────────────┐    ┌────────┐    ┌──────────┐   │
│   │ Router  │───▶│ Researcher │───▶│ Writer │◀──▶│ Verifier │   │
│   │(Classify)│   │ (Tavily)   │    │(Draft) │    │(QA Gate) │   │
│   └────┬────┘    └────────────┘    └────────┘    └──────────┘   │
│        │                                                         │
│        ├──[Complaint]──▶ Support Agent ──▶ END                   │
│        └──[Spam]───────────────────────▶ END                     │
└──────────────────────────────────────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │   SQLite / Supabase DB  │
              │  Gmail API Integration  │
              └─────────────────────────┘
```

---

## 🤖 Agent Pipeline

| Agent | Role | Model Tier | Description |
|-------|------|------------|-------------|
| 🚦 **Router** | Classifier | Fast / Cheap | Classifies emails into Lead, Complaint, or Spam using structured output |
| 🔍 **Researcher** | Intelligence | Fast | Extracts company names and fetches real-time data via Tavily search |
| ✍️ **Writer** | Drafter | Medium / Creative | Drafts personalized sales responses grounded in research data |
| ⚖️ **Verifier** | Quality Gate | Smart / Precise | Reviews drafts for tone, hallucinations, and quality — triggers revision loop |
| 🛡️ **Support** | Complaint Handler | Medium | Generates empathetic responses for customer complaints |

### Key Patterns

- **Supervisor + Reflection**: The Verifier acts as a quality gate with a Writer ↔ Verifier revision loop
- **Loop Control**: Dual safeguards prevent infinite loops — explicit `APPROVE` keyword and a configurable max-revision counter (default: 3)
- **Model Routing**: Each agent uses a model tier optimized for its task to balance cost and quality
- **Grounded Responses**: The Writer is strictly constrained to only use facts from Tavily research data — no hallucinated company details
- **PII Redaction**: Email/phone/credit card numbers are automatically redacted before LLM processing
- **Graceful Fallback**: Primary model (Google Gemini) with automatic fallback to Groq (Llama 3.3)

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Python 3.11** | Runtime |
| **FastAPI** | REST API framework |
| **LangGraph** | Multi-agent orchestration |
| **LangChain** | LLM abstraction layer |
| **Google Gemini** | Primary LLM provider |
| **Groq (Llama 3.3)** | Fallback LLM provider |
| **Tavily** | Real-time web search for company research |
| **SQLite** | Local persistent storage |
| **Supabase** | Auth (JWT) + cloud database |
| **Stripe** | Billing integration |
| **Gmail API** | Email polling and sending |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **Vite 8** | Build tool and dev server |
| **React Router 7** | Client-side routing |
| **Framer Motion** | Animations |
| **Recharts** | Dashboard charts |
| **Lucide React** | Icon library |
| **Supabase JS** | Authentication client |
| **Axios** | HTTP client |

### DevOps
| Technology | Purpose |
|------------|---------|
| **Docker** | Multi-stage containerization |
| **Docker Compose** | Multi-service orchestration |
| **Nginx** | Frontend static file server + API proxy |
| **GitHub Actions** | CI/CD pipeline |
| **pytest** | Backend test framework |

---

## 📁 Project Structure

```
Beaver_Agent/
├── main.py                     # FastAPI application entry point
├── app.py                      # Streamlit legacy UI
├── requirements.txt            # Python dependencies (pinned)
├── Dockerfile                  # Multi-stage backend Docker image
├── docker-compose.yml          # Full-stack orchestration
├── pytest.ini                  # Test configuration
├── .env.example                # Environment template
├── .gitignore
│
├── src/                        # Backend source code
│   ├── config.py               # Centralized config (Pydantic Settings)
│   ├── agents/                 # AI Agent nodes
│   │   ├── router.py           # Email classification (structured output)
│   │   ├── researcher.py       # Company research (Tavily search)
│   │   ├── writer.py           # Draft generation (grounded)
│   │   ├── verifier.py         # Quality gate (reflection pattern)
│   │   └── support.py          # Complaint handler
│   ├── core/                   # Orchestration engine
│   │   ├── graph.py            # LangGraph workflow definition
│   │   ├── state.py            # Shared state (TypedDict)
│   │   └── factory.py          # LLM factory with model routing + fallback
│   ├── middleware/
│   │   └── auth.py             # Supabase JWT verification
│   └── utils/
│       ├── db.py               # SQLite database layer
│       ├── logger.py           # Structured logging (UTF-8 safe)
│       ├── redactor.py         # PII redaction (email, phone, CC)
│       ├── email_service.py    # Gmail API integration
│       ├── google_auth.py      # Google OAuth handler
│       └── poller.py           # Background email poller
│
├── frontend/                   # React SaaS application
│   ├── Dockerfile              # Nginx-served production build
│   ├── nginx.conf              # Nginx config with API proxy
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   └── src/
│       ├── App.jsx             # Root with routing and auth guards
│       ├── main.jsx            # Vite entry point
│       ├── index.css           # Global styles and design tokens
│       ├── contexts/
│       │   └── AuthContext.jsx # Supabase auth state management
│       ├── hooks/
│       │   └── useHealth.js    # API health check hook
│       ├── services/
│       │   └── api.js          # Axios HTTP client
│       ├── components/
│       │   ├── EmailInput.jsx  # Email input form
│       │   ├── ResultDisplay.jsx # Agent pipeline results
│       │   ├── Sidebar.jsx     # Navigation sidebar
│       │   └── StatusBadge.jsx # Category status indicator
│       └── pages/
│           ├── LandingPage.jsx # Public marketing page
│           ├── AuthPage.jsx    # Login / signup
│           ├── AppPage.jsx     # Email processing workspace
│           ├── DashboardPage.jsx # Analytics dashboard
│           └── SettingsPage.jsx  # User settings
│
├── tests/                      # Test suite
│   ├── conftest.py             # Shared fixtures (in-memory DB)
│   ├── test_api.py             # API endpoint tests
│   ├── test_agents.py          # Agent unit tests
│   └── test_db.py              # Database layer tests
│
└── .github/workflows/
    └── ci.yml                  # CI/CD: lint, test, security, build, deploy
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+**
- **Node.js 20+** and **Yarn** (for frontend)
- **Docker** and **Docker Compose** (optional, for containerized deployment)

### 1. Clone the Repository

```bash
git clone https://github.com/Harshalzarikar/Beaver-agent.git
cd Beaver-agent
```

### 2. Backend Setup

```bash
# Create and activate virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
# Copy the template
cp .env.example .env

# Edit .env with your API keys (at minimum, set GOOGLE_API_KEY)
```

> **Minimum requirement**: A [Google Gemini API key](https://aistudio.google.com/apikey) is needed to run the agent pipeline. All other keys are optional.

### 4. Run the Backend

```bash
# Start the FastAPI server
python main.py

# The API is now running at http://localhost:8000
# Interactive docs available at http://localhost:8000/docs (debug mode only)
```

### 5. Frontend Setup

```bash
cd frontend

# Copy environment template
cp .env.example .env.local

# Install dependencies
yarn install

# Start the dev server
yarn dev

# The frontend is now running at http://localhost:5173
```

---

## ⚙️ Configuration

All configuration is managed through environment variables, loaded via [Pydantic Settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/) from the `.env` file.

### Required Variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_API_KEY` | Google Gemini API key ([get one here](https://aistudio.google.com/apikey)) |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GROQ_API_KEY` | — | Groq API key for Llama 3.3 fallback |
| `TAVILY_API_KEY` | — | Tavily API key for company research |
| `API_KEY` | — | Static API key to protect endpoints |
| `DEBUG` | `False` | Enable debug mode (shows Swagger docs) |
| `LOG_LEVEL` | `INFO` | Logging level |
| `ALLOWED_ORIGINS` | `localhost:5173,localhost:3000` | CORS origins (comma-separated) |
| `MAX_EMAIL_LENGTH` | `10000` | Max email character limit |
| `DB_NAME` | `beaver.db` | SQLite database filename |

### Model Routing (override defaults)

| Variable | Default | Description |
|----------|---------|-------------|
| `ROUTER_MODEL` | `gemini-2.5-flash` | Classification model |
| `WRITER_MODEL` | `gemini-2.5-flash` | Draft generation model |
| `VERIFIER_MODEL` | `gemini-2.5-flash` | Quality review model |
| `RESEARCHER_MODEL` | `gemini-2.5-flash` | Entity extraction model |
| `MAX_REVISIONS` | `3` | Max Writer ↔ Verifier loops |
| `RECURSION_LIMIT` | `15` | LangGraph hard recursion limit |

### SaaS Configuration (optional)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key (safe for browser) |
| `SUPABASE_JWT_SECRET` | JWT secret for server-side verification |
| `STRIPE_SECRET_KEY` | Stripe secret key for billing |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRO_PRICE_ID` | Stripe price ID for Pro plan |

### Gmail Integration (optional)

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 client secret |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL |
| `POLL_INTERVAL` | Gmail polling interval in seconds (default: 60) |

---

## 📡 API Reference

### Health Check

```http
GET /health
```

Returns the API health status. No authentication required.

**Response:**
```json
{
  "status": "healthy",
  "service": "Beaver Agent"
}
```

### Process Email

```http
POST /process
```

Runs the full multi-agent pipeline on an inbound email.

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| `X-API-Key` | If `API_KEY` is set | Static API key |
| `Authorization` | Optional | `Bearer <supabase_jwt>` for per-user tracking |

**Request Body:**
```json
{
  "email_text": "Subject: Enterprise Inquiry\n\nHi, I'm the CTO at Acme Corp...",
  "thread_id": "optional-session-id"
}
```

**Response:**
```json
{
  "thread_id": "uuid",
  "category": "Lead",
  "company": "Acme Corp",
  "draft": "Dear Sarah,\n\nThank you for your interest...",
  "revisions": 1,
  "time_ms": 3200,
  "trace": [
    "📧 Email classified as: Lead",
    "🔍 Researched: Acme Corp",
    "✍️ Draft v1 created",
    "⚖️ Verdict: APPROVED"
  ]
}
```

**Rate Limit:** 20 requests/minute per IP address.

### History

```http
GET /history?limit=20
```

Returns the most recent processed email records (max 100). Filters by user if authenticated.

### Usage Stats

```http
GET /usage
```

Returns email processing statistics for the current month.

**Response:**
```json
{
  "this_month": {
    "total": 47,
    "leads": 32,
    "complaints": 10,
    "spam": 5,
    "avg_time_ms": 2800
  }
}
```

---

## 💻 Frontend

The frontend is a full SaaS application built with **React 19** and **Vite 8**.

### Pages

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Marketing landing page |
| `/login` | Public | Sign in (email/password or Google OAuth) |
| `/signup` | Public | Create account |
| `/app` | Protected | Email processing workspace |
| `/dashboard` | Protected | Analytics with charts and usage stats |
| `/settings` | Protected | Account and preferences |

### Authentication

Authentication is handled by **Supabase Auth** with support for:
- Email/password sign-up and sign-in
- Google OAuth (social login)
- Automatic JWT token management and refresh
- Protected route guards via `<ProtectedRoute>` wrapper

### Frontend Environment Variables

Create `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## 🧪 Testing

The test suite uses **pytest** with an isolated in-memory SQLite database so tests never touch the production `beaver.db`.

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage report
pytest --cov=src --cov=main --cov-report=term-missing -v

# Run specific test module
pytest tests/test_api.py
pytest tests/test_agents.py
pytest tests/test_db.py
```

### Test Coverage

| Module | What's Tested |
|--------|---------------|
| `test_api.py` | API endpoints (health, process, history, usage) |
| `test_agents.py` | Individual agent nodes (router, researcher, writer, verifier, support) |
| `test_db.py` | Database operations (CRUD, migrations, multi-tenant queries) |

### Test Fixtures

Shared fixtures in `conftest.py` provide:
- `client` — FastAPI `TestClient` with patched in-memory DB
- `mock_graph_result` — Realistic Lead pipeline output
- `mock_complaint_result` — Realistic Complaint pipeline output
- `sample_lead_email` / `sample_complaint_email` — Example email inputs

---

## 🐳 Docker Deployment

### Quick Start with Docker Compose

```bash
# Build and start all services
docker-compose up --build -d

# Services:
#   - API:      http://localhost:8000
#   - Frontend: http://localhost:3000
```

### Architecture

| Service | Container | Port | Description |
|---------|-----------|------|-------------|
| `api` | `beaver-api` | `8000` | FastAPI backend (2 Uvicorn workers) |
| `frontend` | `beaver-frontend` | `3000` | Nginx serving Vite build |

### Production Features

- **Multi-stage builds** — separate builder and runtime stages for smaller images
- **Non-root user** — the API container runs as `appuser` (UID 1001)
- **Health checks** — automatic container health monitoring
- **Volume mounts** — SQLite database and OAuth tokens persist across restarts
- **Service dependencies** — frontend waits for API to be healthy before starting
- **Nginx reverse proxy** — serves static files and proxies `/api` requests to the backend

### Individual Docker Commands

```bash
# Build backend image only
docker build -t beaver-agent:latest .

# Build frontend image only
docker build -t beaver-frontend:latest ./frontend

# Run backend standalone
docker run -d \
  --name beaver-api \
  -p 8000:8000 \
  --env-file .env \
  beaver-agent:latest
```

---

## 🔄 CI/CD Pipeline

The GitHub Actions pipeline (`.github/workflows/ci.yml`) runs on every push and PR to `main` and `develop`.

### Pipeline Stages

```
Backend Tests → Security Scan → Frontend Build → Docker Build → Deploy
```

| Stage | What It Does |
|-------|-------------|
| **Backend Tests** | `flake8` lint → `black` format check → `mypy` type check → `pytest` with coverage |
| **Security Scan** | `bandit` static analysis → `pip-audit` dependency vulnerability scan |
| **Frontend Build** | `yarn install` → `yarn lint` → `yarn build` |
| **Docker Build** | Build image → smoke test (import validation) |
| **Deploy** | Triggered only on push to `main` after all checks pass |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request targeting `develop`

### Development Guidelines

- Follow the existing code style (Black formatting, type hints)
- Add tests for new features
- Update the `.env.example` if adding new environment variables
- Keep agent prompts in their respective agent files

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ❤️ using LangGraph, FastAPI, and React

</div>
