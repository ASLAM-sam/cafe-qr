from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CafeTaxSettings(BaseModel):
    tax_enabled: bool = False
    tax_rate_percent: float = Field(default=0.0, ge=0.0, le=100.0)


class CafeBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    phone: Optional[str] = Field(None, max_length=30)
    email: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = Field(None, max_length=255)
    currency: str = Field(default="INR", max_length=10)
    primary_color: Optional[str] = Field(default="#0f172a", max_length=30)
    secondary_color: Optional[str] = Field(default="#f8fafc", max_length=30)
    tax_settings: CafeTaxSettings = Field(default_factory=CafeTaxSettings)


class CafeCreate(CafeBase):
    subdomain: str = Field(..., min_length=2, max_length=32)
    owner_name: str = Field(..., min_length=2, max_length=100)
    owner_email: str = Field(..., max_length=100)
    owner_password: str = Field(..., min_length=6)


class CafeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    currency: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    tax_settings: Optional[CafeTaxSettings] = None


class CafeResponse(CafeBase):
    cafe_id: str
    slug: str
    subdomain: str
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    status: str = "ACTIVE"
    created_at: datetime
    updated_at: datetime


class PublicCafeResponse(BaseModel):
    name: str
    subdomain: str
    description: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    currency: str
    logo: Optional[str] = None
    banner: Optional[str] = None
    primary_color: Optional[str] = None
    tax_settings: Optional[CafeTaxSettings] = None
    status: str = "ACTIVE"
