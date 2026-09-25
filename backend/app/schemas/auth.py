from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field, model_validator


Role = Literal["OWNER", "ADMIN", "PLATFORM_ADMIN"]


class LoginRequest(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: str = Field(..., min_length=1)

    @model_validator(mode="after")
    def validate_identifier(self) -> "LoginRequest":
        if not self.email and not self.username:
            raise ValueError("Either email or username must be provided.")
        return self


class UserResponse(BaseModel):
    user_id: str
    cafe_id: Optional[str] = None
    name: str
    email: Optional[str] = None
    username: Optional[str] = None
    role: Role
    status: str = "ACTIVE"
    created_at: datetime


class TokenResponse(BaseModel):
    success: bool = True
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1, description="Current password")
    new_password: str = Field(..., min_length=8, description="New password, minimum 8 characters")
    confirm_password: str = Field(..., min_length=8, description="Confirmation of new password")

    @model_validator(mode="after")
    def validate_passwords(self) -> "ChangePasswordRequest":
        if self.new_password != self.confirm_password:
            raise ValueError("New password and confirm password do not match.")
        if self.current_password == self.new_password:
            raise ValueError("New password cannot be identical to current password.")
        return self

