from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.dependencies import get_db, get_current_tenant_cafe, get_public_subdomain
from app.core.rate_limit import order_rate_limiter
from app.repositories.order_repository import OrderRepository
from app.repositories.product_repository import ProductRepository
from app.repositories.table_repository import TableRepository
from app.repositories.cafe_repository import CafeRepository
from app.repositories.addon_repository import AddonRepository
from app.services.order_service import OrderService
from app.schemas.order import OrderCreateRequest, OrderResponse, OrderStatusUpdate

router = APIRouter(tags=["Orders"])


@router.post("/api/public/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
@router.post("/public/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_customer_order(
    data: OrderCreateRequest,
    request: Request,
    subdomain: str = Depends(get_public_subdomain),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Public customer endpoint: place an order.
    The backend computes all prices, subtotals, and taxes authoritative from database.
    """
    order_rate_limiter.check(request)
    cafe_repo = CafeRepository(db)
    cafe = await cafe_repo.get_by_subdomain(subdomain)
    if not cafe:
        # Fallback if table_token provided, resolve cafe from table
        if data.table_token:
            tbl_repo = TableRepository(db)
            table = await tbl_repo.get_by_qr_token(data.table_token)
            if table:
                cafe = await cafe_repo.get_by_id(table["cafe_id"])

    if not cafe:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cafe not found for this order submission.",
        )

    order_repo = OrderRepository(db)
    product_repo = ProductRepository(db)
    table_repo = TableRepository(db)
    addon_repo = AddonRepository(db)
    service = OrderService(
        order_repo=order_repo,
        product_repo=product_repo,
        table_repo=table_repo,
        cafe_repo=cafe_repo,
        addon_repo=addon_repo,
    )

    payload = data.model_dump()
    header_idem_key = request.headers.get("idempotency-key") or request.headers.get("Idempotency-Key")
    if not payload.get("idempotency_key") and header_idem_key:
        payload["idempotency_key"] = header_idem_key

    return await service.create_order(cafe["cafe_id"], payload)


@router.get("/api/public/orders/{order_reference}", response_model=OrderResponse)
@router.get("/public/orders/{order_reference}", response_model=OrderResponse)
async def get_customer_order_status(
    order_reference: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Public customer endpoint: track order status securely via unguessable order reference."""
    order_repo = OrderRepository(db)
    product_repo = ProductRepository(db)
    table_repo = TableRepository(db)
    cafe_repo = CafeRepository(db)
    service = OrderService(order_repo, product_repo, table_repo, cafe_repo)
    return await service.get_order_by_reference(order_reference)


@router.get("/api/orders", response_model=List[OrderResponse])
@router.get("/api/admin/orders", response_model=List[OrderResponse])
async def list_admin_orders(
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_cafe: Dict[str, Any] = Depends(get_current_tenant_cafe),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Authenticated café admin endpoint: fetch live and historical orders."""
    order_repo = OrderRepository(db)
    product_repo = ProductRepository(db)
    table_repo = TableRepository(db)
    cafe_repo = CafeRepository(db)
    service = OrderService(order_repo, product_repo, table_repo, cafe_repo)
    return await service.list_orders(
        cafe_id=current_cafe["cafe_id"],
        status=status,
        limit=limit,
        skip=skip,
    )


@router.get("/api/orders/{order_id}", response_model=OrderResponse)
async def get_order_details(
    order_id: str,
    current_cafe: Dict[str, Any] = Depends(get_current_tenant_cafe),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Authenticated café admin endpoint: fetch complete order details."""
    order_repo = OrderRepository(db)
    product_repo = ProductRepository(db)
    table_repo = TableRepository(db)
    cafe_repo = CafeRepository(db)
    service = OrderService(order_repo, product_repo, table_repo, cafe_repo)
    return await service.get_order(current_cafe["cafe_id"], order_id)


@router.patch("/api/orders/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: str,
    update: OrderStatusUpdate,
    current_cafe: Dict[str, Any] = Depends(get_current_tenant_cafe),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Authenticated café admin endpoint: advance order through state machine.
    (PLACED -> ACCEPTED -> PREPARING -> READY -> COMPLETED / CANCELLED)
    """
    order_repo = OrderRepository(db)
    product_repo = ProductRepository(db)
    table_repo = TableRepository(db)
    cafe_repo = CafeRepository(db)
    service = OrderService(order_repo, product_repo, table_repo, cafe_repo)
    return await service.update_order_status(
        cafe_id=current_cafe["cafe_id"],
        order_id=order_id,
        new_status=update.status,
    )


@router.get("/api/admin/dashboard/stats")
async def get_dashboard_stats(
    current_cafe: Dict[str, Any] = Depends(get_current_tenant_cafe),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Authenticated café admin endpoint: fetch live counts for the dashboard.
    Returns genuine real data (0s when empty - strictly no fake numbers).
    """
    order_repo = OrderRepository(db)
    product_repo = ProductRepository(db)
    table_repo = TableRepository(db)
    cafe_repo = CafeRepository(db)
    service = OrderService(order_repo, product_repo, table_repo, cafe_repo)
    return await service.get_dashboard_stats(current_cafe["cafe_id"])
