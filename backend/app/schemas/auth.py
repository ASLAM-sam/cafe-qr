from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field


Role = Literal["OWNER", "ADMIN", "PLATFORM_ADMIN"]


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class UserResponse(BaseModel):
    user_id: str
    cafe_id: str
    name: str
    email: str
    role: Role
    status: str = "ACTIVE"
    created_at: datetime


class TokenResponse(BaseModel):
    success: bool = True
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
