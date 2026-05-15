from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from ..db.supabase import supabase

security = HTTPBearer()


async def get_current_user(auth: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verifies the Supabase JWT token and returns the user object.
    """
    try:
        user_response = supabase.auth.get_user(auth.credentials)
        if not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return {
            "id": user_response.user.id,
            "email": user_response.user.email,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Auth error: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
