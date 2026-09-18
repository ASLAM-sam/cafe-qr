from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from app.repositories.user_repository import UserRepository
from app.repositories.cafe_repository import CafeRepository
from app.core.security import verify_password, create_access_token


class AuthService:
    def __init__(self, user_repo: UserRepository, cafe_repo: CafeRepository):
        self.user_repo = user_repo
        self.cafe_repo = cafe_repo

    async def authenticate_user(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticate user credentials and return user document and JWT."""
        user = await self.user_repo.get_by_email(email)
        if not user:
            # Generic error to prevent email enumeration
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not verify_password(password, user.get("password_hash", "")):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if user.get("status") != "ACTIVE":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive. Please contact support.",
            )

        # Generate access token containing user_id, cafe_id, role
        token_payload = {
            "sub": user["user_id"],
            "cafe_id": user["cafe_id"],
            "role": user.get("role", "OWNER"),
        }
        access_token = create_access_token(token_payload)

        # Strip password hash before returning
        user_copy = user.copy()
        user_copy.pop("password_hash", None)

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_copy,
        }
