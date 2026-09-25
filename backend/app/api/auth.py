from typing import Dict, Any
from fastapi import APIRouter, Depends, Response, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.dependencies import get_db, get_current_user
from app.core.config import settings
from app.core.rate_limit import login_rate_limiter
from app.repositories.user_repository import UserRepository
from app.repositories.cafe_repository import CafeRepository
from app.services.auth_service import AuthService
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse, ChangePasswordRequest

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: LoginRequest,
    response: Response,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Authenticate café owner/manager and establish session."""
    login_rate_limiter.check(request)
    user_repo = UserRepository(db)
    cafe_repo = CafeRepository(db)
    auth_service = AuthService(user_repo, cafe_repo)

    result = await auth_service.authenticate_user(
        email=str(credentials.email) if credentials.email else None,
        username=credentials.username,
        password=credentials.password,
    )

    # Set secure HTTP-only cookie (none for cross-site production, lax for local development)
    samesite_val = "none" if settings.ENVIRONMENT != "development" else "lax"
    response.set_cookie(
        key="access_token",
        value=result["access_token"],
        httponly=True,
        secure=settings.ENVIRONMENT != "development",
        samesite=samesite_val,
        max_age=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return result


@router.post("/logout")
async def logout(response: Response):
    """Clear session cookie and log out."""
    samesite_val = "none" if settings.ENVIRONMENT != "development" else "lax"
    response.delete_cookie(
        key="access_token",
        secure=settings.ENVIRONMENT != "development",
        samesite=samesite_val,
    )
    return {"success": True, "message": "Successfully logged out."}


@router.get("/me")
async def get_me(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Retrieve details of the authenticated user and their café tenant."""
    cafe = None
    if current_user.get("cafe_id") and current_user.get("cafe_id") != "platform":
        cafe_repo = CafeRepository(db)
        cafe = await cafe_repo.get_by_id(current_user["cafe_id"])
    return {
        "user": current_user,
        "cafe": cafe,
    }


@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Authenticated user endpoint: Securely change password.
    Requires valid session token.
    Requires current password verification before updating password.
    """
    user_repo = UserRepository(db)
    cafe_repo = CafeRepository(db)
    auth_service = AuthService(user_repo, cafe_repo)
    return await auth_service.change_password(
        user_id=current_user["user_id"],
        current_password=data.current_password,
        new_password=data.new_password,
    )

