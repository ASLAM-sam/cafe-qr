from datetime import datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, Field


OrderType = Literal["DINE_IN", "TAKEAWAY"]
OrderStatus = Literal["PLACED", "ACCEPTED", "PREPARING", "READY", "COMPLETED", "CANCELLED"]
PaymentStatus = Literal["PENDING", "PAID", "FAILED"]


class OrderItemRequest(BaseModel):
    product_id: str
    quantity: int = Field(..., ge=1, le=50)


class OrderCreateRequest(BaseModel):
    table_id: Optional[str] = None
    table_token: Optional[str] = None
    order_type: OrderType = "DINE_IN"
    customer_name: Optional[str] = Field(None, max_length=100)
    customer_phone: Optional[str] = Field(None, max_length=30)
    items: List[OrderItemRequest] = Field(..., min_length=1, max_length=50)
    idempotency_key: Optional[str] = Field(None, max_length=100)


class OrderItemResponse(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    unit_price: float
    subtotal: float


class OrderResponse(BaseModel):
    order_id: str
    order_number: str
    order_reference: str
    cafe_id: str
    table_id: Optional[str] = None
    table_number: Optional[str] = None
    order_type: OrderType
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    items: List[OrderItemResponse]
    subtotal: float
    tax: float
    discount: float = 0.0
    total: float
    payment_status: PaymentStatus = "PENDING"
    order_status: OrderStatus = "PLACED"
    created_at: datetime
    updated_at: datetime


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
