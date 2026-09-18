from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field


TableStatus = Literal["AVAILABLE", "OCCUPIED"]


class TableBase(BaseModel):
    table_number: str = Field(..., min_length=1, max_length=20)
    status: TableStatus = "AVAILABLE"


class TableCreate(BaseModel):
    table_number: str = Field(..., min_length=1, max_length=20)


class TableUpdate(BaseModel):
    table_number: Optional[str] = Field(None, min_length=1, max_length=20)
    status: Optional[TableStatus] = None


class TableResponse(TableBase):
    table_id: str
    cafe_id: str
    qr_token: str
    qr_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
