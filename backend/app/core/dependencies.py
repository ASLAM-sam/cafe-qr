import re
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, Header, Request, status
from fastapi.security import OAuth2PasswordBearer
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.config import settings
from app.core.database import get_database
from app.core.postgres_database import get_postgres_session
from app.core.security import decode_access_token
from app.repositories.user_repository import UserRepository
from app.repositories.cafe_repository import CafeRepository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_db() -> AsyncIOMotorDatabase:
    """Dependency to provide database instance."""
    return get_database()


def get_pg_session():
    """Alias for get_postgres_session."""
    return get_postgres_session()


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


SUBDOMAIN_REGEX = re.compile(r"^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$")
RESERVED_SUBDOMAINS = {"www", "app", "platform", "api", "admin", "mail", "smtp", "cdn", "static"}


async def get_public_subdomain(
    request: Request,
    x_tenant_subdomain: Optional[str] = Header(None, alias="X-Tenant-Subdomain"),
) -> str:
    """
    Resolves the café subdomain for public customer queries.
    Sources:
    1. Custom Header: X-Tenant-Subdomain (sent by frontend middleware/proxy)
    2. Query parameter ?cafe= or ?subdomain=
    3. Host header subdomain (e.g. brewhouse.yourdomain.com)
    """
    candidate: Optional[str] = None

    if x_tenant_subdomain and x_tenant_subdomain.strip():
        candidate = x_tenant_subdomain.strip().lower()
    elif request.query_params.get("subdomain"):
        candidate = request.query_params["subdomain"].strip().lower()
    elif request.query_params.get("cafe"):
        candidate = request.query_params["cafe"].strip().lower()
    else:
        # Host header parsing
        host = request.headers.get("host", "").split(":")[0].strip().lower()
        clean_app_domain = settings.APP_DOMAIN.split(":")[0].strip().lower()

        if host.endswith(f".{clean_app_domain}"):
            candidate = host[: -(len(clean_app_domain) + 1)]
        elif host.endswith(".localhost"):
            candidate = host.replace(".localhost", "")
        else:
            parts = host.split(".")
            if len(parts) > 2 and parts[0] not in RESERVED_SUBDOMAINS:
                candidate = parts[0]

    if candidate and SUBDOMAIN_REGEX.match(candidate) and candidate not in RESERVED_SUBDOMAINS:
        return candidate

    # In development/test environments, allow default fallback for local dev simplicity
    if settings.ENVIRONMENT == "development":
        return "brewhouse"

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="A valid café tenant subdomain is required.",
    )



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
