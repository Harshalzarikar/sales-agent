"""
JWT Authentication Middleware — Supabase JWT Verification.

Validates the Bearer token issued by Supabase Auth on every protected request.
Extracts the user_id (sub claim) for multi-tenant data isolation.
"""
import os
import httpx
from fastapi import HTTPException, Depends, Header
from typing import Optional
from src.utils.logger import get_logger

logger = get_logger(__name__)

# Supabase project URL — used to fetch the JWKS (public keys)
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")  # from Project Settings > API


def get_current_user_id(authorization: Optional[str] = Header(default=None)) -> Optional[str]:
    """
    Extracts user_id from Supabase JWT bearer token.

    Returns None if no auth header is present (allows unauthenticated access
    to endpoints that don't require it). Routes that need auth should call
    require_user_id() instead.

    In production this validates the JWT signature against Supabase's public key.
    For now it uses the Supabase JWT secret for symmetric verification.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization.split(" ", 1)[1]

    # If no Supabase is configured, extract sub claim without verification
    # (for development only)
    if not SUPABASE_JWT_SECRET and not SUPABASE_URL:
        logger.warning("Supabase not configured — skipping JWT verification (dev mode)")
        try:
            import base64
            import json
            payload_b64 = token.split(".")[1]
            # Add padding
            payload_b64 += "=" * (4 - len(payload_b64) % 4)
            payload = json.loads(base64.urlsafe_b64decode(payload_b64))
            return payload.get("sub")
        except Exception:
            return None

    # Full JWT verification using python-jose
    try:
        from jose import jwt, JWTError
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},  # Supabase JWTs don't use aud by default
        )
        user_id = payload.get("sub")
        logger.debug(f"Authenticated user: {user_id}")
        return user_id
    except Exception as e:
        logger.warning(f"JWT verification failed: {e}")
        return None


def require_user_id(user_id: Optional[str] = Depends(get_current_user_id)) -> str:
    """
    Dependency that requires a valid authenticated user.
    Raises 401 if no valid JWT is present.
    """
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please sign in at the Beaver Agent app.",
        )
    return user_id
