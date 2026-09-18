from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ProductBase(BaseModel):
    category_id: str
    name: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = Field(None, max_length=1000)
    price: float = Field(..., ge=0.0)
    image_url: Optional[str] = None
    image_public_id: Optional[str] = None
    is_available: bool = True
    display_order: int = Field(default=0, ge=0)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    category_id: Optional[str] = None
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = None
    price: Optional[float] = Field(None, ge=0.0)
    image_url: Optional[str] = None
    image_public_id: Optional[str] = None
    is_available: Optional[bool] = None
    display_order: Optional[int] = Field(None, ge=0)


class ProductResponse(ProductBase):
    product_id: str
    cafe_id: str
    created_at: datetime
    updated_at: datetime
