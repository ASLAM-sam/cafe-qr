from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class AddonItem(BaseModel):
    """A single add-on option within an add-on group."""
    addon_item_id: Optional[str] = None
    name: str = Field(..., min_length=1, max_length=100)
    price: float = Field(default=0.0, ge=0.0)
    is_available: bool = True


class AddonGroupBase(BaseModel):
    """An add-on group (e.g., 'Size', 'Extra Toppings') with selectable items."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    is_required: bool = False
    max_selections: int = Field(default=1, ge=1, le=20)
    min_selections: int = Field(default=0, ge=0)
    display_order: int = Field(default=0, ge=0)
    items: List[AddonItem] = Field(default_factory=list)


class AddonGroupCreate(AddonGroupBase):
    product_ids: List[str] = Field(default_factory=list, max_length=200)


class AddonGroupUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    is_required: Optional[bool] = None
    max_selections: Optional[int] = Field(None, ge=1, le=20)
    min_selections: Optional[int] = Field(None, ge=0)
    display_order: Optional[int] = Field(None, ge=0)
    items: Optional[List[AddonItem]] = None
    product_ids: Optional[List[str]] = None


class AddonGroupResponse(AddonGroupBase):
    addon_group_id: str
    cafe_id: str
    product_ids: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
