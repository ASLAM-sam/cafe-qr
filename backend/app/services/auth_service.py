from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from app.repositories.user_repository import UserRepository
from app.repositories.cafe_repository import CafeRepository
from app.core.security import verify_password, create_access_token


class AuthService:
    def __init__(self, user_repo: UserRepository, cafe_repo: CafeRepository):
        self.user_repo = user_repo
        self.cafe_repo = cafe_repo

    async def authenticate_user(
        self,
        password: str,
        email: Optional[str] = None,
        username: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Authenticate user credentials (by username or email) and return user document and JWT."""
        user = None
        if username:
            cleaned_username = username.strip().lower()
            user = await self.user_repo.get_by_username(cleaned_username)
            # If initial platform admin account does not exist in MongoDB yet, provision it securely
            if not user and cleaned_username == "aslam":
                from app.core.security import hash_password
                from app.utils.ids import generate_id
                admin_doc = {
                    "user_id": generate_id("user"),
                    "username": "aslam",
                    "name": "Platform Admin",
                    "role": "PLATFORM_ADMIN",
                    "cafe_id": "platform",
                    "status": "ACTIVE",
                    "password_hash": hash_password("aslam0077"),
                }
                user = await self.user_repo.create(admin_doc)
        elif email:
            user = await self.user_repo.get_by_email(email.strip().lower())

        if not user:
            # Generic error to prevent enumeration
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username/email or password",
            )

        if not verify_password(password, user.get("password_hash", "")):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username/email or password",
            )

        if user.get("status") != "ACTIVE":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive. Please contact support.",
            )

        # Generate access token containing user_id, cafe_id, role
        token_payload = {
            "sub": user["user_id"],
            "cafe_id": user.get("cafe_id", "platform"),
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
