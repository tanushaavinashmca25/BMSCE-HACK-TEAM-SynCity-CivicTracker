from fastapi import Header, HTTPException, status
from typing import Optional
from ..config import settings


def require_admin(x_admin_key: Optional[str] = Header(default=None)):
    """
    Lightweight admin gate for dashboard endpoints.
    - If ADMIN_API_KEY is configured, require it via the X-Admin-Key header.
    - Else, only allow access when ALLOW_ADMIN_WITHOUT_KEY=true (demo mode).
    """
    if settings.ADMIN_API_KEY:
        if x_admin_key != settings.ADMIN_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid admin key",
            )
        return {"role": "authority"}
    if settings.ALLOW_ADMIN_WITHOUT_KEY:
        return {"role": "authority"}
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Admin endpoints disabled (set ADMIN_API_KEY).",
    )
