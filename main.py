"""
Production API — FastAPI application with health checks, error handling, CORS,
rate limiting, input validation, and JWT / API key authentication.
"""
import time
import uvicorn
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import json
from pydantic import BaseModel, Field
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from src.core.graph import graph
from src.config import settings
from src.utils.db import db
from src.utils.logger import get_logger
from src.middleware.auth import get_current_user_id
from typing import Optional

logger = get_logger(__name__)

# --- Rate Limiter ---
limiter = Limiter(key_func=get_remote_address)


# --- Lifespan (modern FastAPI pattern) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    logger.info(f"🚀 {settings.app_name} started (debug={settings.debug})")
    yield
    logger.info(f"🛑 {settings.app_name} shutting down.")


# --- App ---
app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Production Multi-Agent Sales Orchestrator",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,   # hide Swagger in production
    redoc_url="/redoc" if settings.debug else None,
)

# Attach rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- CORS: restricted to configured origins ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# --- Optional API Key Authentication ---
def verify_api_key(x_api_key: Optional[str] = Header(default=None)):
    """
    If API_KEY is set in environment, all /process calls must include
    the 'X-API-Key' header with the matching value.
    """
    if settings.api_key and x_api_key != settings.api_key:
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing API key. Provide 'X-API-Key' header."
        )


# --- Request / Response Models ---
class ProcessRequest(BaseModel):
    email_text: str = Field(
        ...,
        min_length=1,
        max_length=settings.max_email_length,
        description="Raw inbound email content to process.",
    )
    thread_id: Optional[str] = Field(
        default=None,
        description="Optional session/thread ID for multi-turn tracking.",
    )


class ProcessResponse(BaseModel):
    thread_id: str
    category: str
    company: Optional[str]
    draft: str
    revisions: int
    time_ms: int
    trace: list[str]


class HistoryRecord(BaseModel):
    thread_id: str
    category: str
    company: Optional[str]
    draft: str
    created_at: str


# --- Endpoints ---
@app.get("/health", tags=["System"])
async def health():
    """Returns API health status. Safe to call without authentication."""
    return {"status": "healthy", "service": settings.app_name}


@app.post(
    "/process",
    tags=["Agent Pipeline"],
    dependencies=[Depends(verify_api_key)],
)
@limiter.limit("20/minute")
async def process_email(
    request: Request,
    req: ProcessRequest,
    user_id: Optional[str] = Depends(get_current_user_id),
):
    """
    Main endpoint: Runs the full multi-agent orchestrator on an inbound email.
    Streams progress using Server-Sent Events (SSE).
    """
    thread_id = req.thread_id or str(uuid.uuid4())
    logger.info(f"📨 New email [Thread: {thread_id}] user={user_id or 'anon'} ({len(req.email_text)} chars)")

    async def event_generator():
        start = time.time()
        final_state = {}
        try:
            # Send initial event
            yield f"data: {json.dumps({'type': 'start', 'thread_id': thread_id})}\n\n"

            async for event in graph.astream(
                {
                    "initial_email": req.email_text,
                    "messages": [f"📨 Request received (Thread: {thread_id})"],
                },
                {
                    "recursion_limit": settings.recursion_limit,
                    "configurable": {"thread_id": thread_id},
                },
                stream_mode="updates"
            ):
                # event is a dict where key is the node name and value is the state update
                for node_name, state_update in event.items():
                    # Update our local copy of the final state
                    final_state.update(state_update)
                    
                    # Yield progress to the client
                    yield f"data: {json.dumps({'type': 'update', 'node': node_name, 'state': state_update})}\n\n"

            # After the stream completes, save to the database
            category = final_state.get("category", "Unknown")
            company = final_state.get("company_name")
            draft = final_state.get("draft_email", "No response generated.")
            revisions = final_state.get("revision_count", 0)
            trace = final_state.get("messages", [])
            elapsed_ms = int((time.time() - start) * 1000)

            try:
                db.save_record(
                    category=category,
                    company=company or "N/A",
                    draft=draft,
                    thread_id=thread_id,
                    user_id=user_id,
                )
            except Exception as e:
                logger.error(f"DB save failed: {e}")

            logger.info(f"✅ Done in {elapsed_ms}ms | {category} | Thread={thread_id}")
            
            # Send final payload
            yield f"data: {json.dumps({'type': 'complete', 'result': {'thread_id': thread_id, 'category': category, 'company': company, 'draft': draft, 'revisions': revisions, 'time_ms': elapsed_ms, 'trace': trace}})}\n\n"

        except Exception as e:
            logger.error(f"Graph execution failed: {e}")
            yield f"data: {json.dumps({'type': 'error', 'detail': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get(
    "/history",
    response_model=list[HistoryRecord],
    tags=["Data"],
    dependencies=[Depends(verify_api_key)],
)
async def get_history(
    limit: int = 20,
    user_id: Optional[str] = Depends(get_current_user_id),
):
    """Returns the most recent processed email records (max 100). Filters by user if authenticated."""
    if limit > 100:
        limit = 100
    try:
        records = db.get_recent_records(limit=limit, user_id=user_id)
        return records
    except Exception as e:
        logger.error(f"History fetch failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve history.")


@app.get("/usage", tags=["Data"])
async def get_usage(user_id: Optional[str] = Depends(get_current_user_id)):
    """
    Returns the current user's email processing stats for the current month.
    Used by the dashboard for the usage meter.
    """
    try:
        stats = db.get_usage_stats(user_id=user_id)
        return stats
    except Exception as e:
        logger.error(f"Usage fetch failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve usage.")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
    )