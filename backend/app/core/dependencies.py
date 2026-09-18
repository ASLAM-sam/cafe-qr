from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, Header, Request, status
from fastapi.security import OAuth2PasswordBearer
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.database import get_database
from app.core.security import decode_access_token
from app.repositories.user_repository import UserRepository
from app.repositories.cafe_repository import CafeRepository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_db() -> AsyncIOMotorDatabase:
    """Dependency to provide database instance."""
    return get_database()


async def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> Dict[str, Any]:
    """
    Extract and verify JWT from Authorization header or HTTP-only cookie.
    Guarantees user exists and is active.
    """
    # 1. Try Bearer token from header
    resolved_token = token

    # 2. Try HTTP-only cookie if header absent
    if not resolved_token:
        resolved_token = request.cookies.get("access_token")

    if not resolved_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(resolved_token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: str = payload["sub"]
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)

    if not user or user.get("status") != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or account is deactivated.",
        )

    user.pop("password_hash", None)
    return user


async def get_current_tenant_cafe(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> Dict[str, Any]:
    """
    Derives the tenant cafe STRICTLY from the authenticated user's verified cafe_id.
    Client-supplied cafe_ids are completely ignored, enforcing strict multi-tenant isolation.
    """
    cafe_id = current_user.get("cafe_id")
    if not cafe_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with any café tenant.",
        )

    cafe_repo = CafeRepository(db)
    cafe = await cafe_repo.get_by_id(cafe_id)
    if not cafe or cafe.get("status") != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The café tenant account was not found or is inactive.",
        )

    return cafe


async def get_public_subdomain(
    request: Request,
    x_tenant_subdomain: Optional[str] = Header(None, alias="X-Tenant-Subdomain"),
) -> str:
    """
    Resolves the café subdomain for public customer queries.
    Sources:
    1. Custom Header: X-Tenant-Subdomain
    2. Host header subdomain (e.g. brewhouse.ourplatform.com)
    3. Query parameter ?cafe= or ?subdomain=
    """
    if x_tenant_subdomain and x_tenant_subdomain.strip():
        return x_tenant_subdomain.strip().lower()

    # Query param fallback
    query_sub = request.query_params.get("subdomain") or request.query_params.get("cafe")
    if query_sub and query_sub.strip():
        return query_sub.strip().lower()

    # Host header parsing
    host = request.headers.get("host", "").split(":")[0]
    parts = host.split(".")
    if len(parts) > 2 and parts[0] != "www":
        return parts[0].lower()

    # Fallback to 'brewhouse' for local test development
    return "brewhouse"


def require_platform_admin(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """Ensures caller has PLATFORM_ADMIN privileges."""
    if current_user.get("role") != "PLATFORM_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Platform administrator privileges required.",
        )
    return current_user
