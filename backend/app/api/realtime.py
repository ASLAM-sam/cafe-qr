from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.dependencies import get_db, get_current_tenant_cafe
from app.services.ably_service import ably_service
from app.repositories.order_repository import OrderRepository

router = APIRouter(prefix="/api/realtime", tags=["Realtime"])


@router.get("/token")
async def get_admin_realtime_token(
    current_cafe: Dict[str, Any] = Depends(get_current_tenant_cafe),
):
    """
    Authenticated café admin endpoint:
    Generate a scoped Ably token request restricted ONLY to this cafe's private order channel.
    """
    cafe_id = current_cafe["cafe_id"]
    capability = {
        f"cafe:{cafe_id}:orders": ["subscribe", "presence"],
    }
    result = await ably_service.create_token_request(
        client_id=f"admin_{cafe_id}",
        capability=capability,
    )
    return result


@router.get("/customer-token/{order_reference}")
async def get_customer_realtime_token(
    order_reference: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Public customer endpoint:
    Generate a scoped Ably token request restricted ONLY to this customer's specific order channel.
    """
    order_repo = OrderRepository(db)
    order = await order_repo.get_by_reference(order_reference)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order reference not found.",
        )

    capability = {
        f"order:{order_reference}": ["subscribe"],
    }
    result = await ably_service.create_token_request(
        client_id=f"cust_{order_reference}",
        capability=capability,
    )
    return result
