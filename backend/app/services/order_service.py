import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from app.repositories.order_repository import OrderRepository
from app.repositories.product_repository import ProductRepository
from app.repositories.table_repository import TableRepository
from app.repositories.cafe_repository import CafeRepository
from app.services.ably_service import AblyService, ably_service
from app.utils.ids import generate_id, generate_order_reference

logger = logging.getLogger("cafe_qr.order_service")


VALID_TRANSITIONS = {
    "PLACED": ["ACCEPTED", "CANCELLED"],
    "ACCEPTED": ["PREPARING", "CANCELLED"],
    "PREPARING": ["READY", "CANCELLED"],
    "READY": ["COMPLETED"],
    "COMPLETED": [],
    "CANCELLED": [],
}


class OrderService:
    def __init__(
        self,
        order_repo: OrderRepository,
        product_repo: ProductRepository,
        table_repo: TableRepository,
        cafe_repo: CafeRepository,
        pub_service: AblyService = ably_service,
    ):
        self.order_repo = order_repo
        self.product_repo = product_repo
        self.table_repo = table_repo
        self.cafe_repo = cafe_repo
        self.ably_service = pub_service

    async def create_order(
        self,
        cafe_id: str,
        order_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a new customer order with server-authoritative pricing."""
        # 1. Check idempotency key to prevent accidental duplicate clicks
        idempotency_key = order_data.get("idempotency_key")
        if idempotency_key:
            existing = await self.order_repo.get_by_idempotency_key(cafe_id, idempotency_key)
            if existing:
                return existing

        # 2. Verify cafe exists and is active
        cafe = await self.cafe_repo.get_by_id(cafe_id)
        if not cafe or cafe.get("status") != "ACTIVE":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cafe is inactive or invalid.",
            )

        # 3. Resolve table if table_token or table_id is provided
        table_number = None
        table_id = order_data.get("table_id")
        table_token = order_data.get("table_token")

        if table_token:
            table = await self.table_repo.get_by_qr_token(table_token)
            if not table or table["cafe_id"] != cafe_id:
                # Check if table_token was passed as table_id
                table_fallback = await self.table_repo.get_by_id(cafe_id, table_token)
                if table_fallback:
                    table = table_fallback
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Invalid table QR code for this cafe.",
                    )
            table_id = table["table_id"]
            table_number = table["table_number"]
        elif table_id:
            table = await self.table_repo.get_by_id(cafe_id, table_id)
            if not table:
                # Check if table_id was passed as qr_token
                table_fallback = await self.table_repo.get_by_qr_token(table_id)
                if table_fallback and table_fallback["cafe_id"] == cafe_id:
                    table = table_fallback
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Invalid table for this cafe.",
                    )
            table_id = table["table_id"]
            table_number = table["table_number"]

        # 4. Validate items and read authoritative prices from database
        requested_items = order_data.get("items", [])
        if not requested_items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order must contain at least one product.",
            )

        product_ids = [item["product_id"] for item in requested_items]
        # Query products belonging strictly to this cafe_id
        db_products = await self.product_repo.get_many_by_ids(cafe_id, product_ids)
        product_map = {p["product_id"]: p for p in db_products}

        if len(db_products) != len(set(product_ids)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more products in your cart do not belong to this cafe or do not exist.",
            )

        calculated_items = []
        subtotal = 0.0

        for item in requested_items:
            prod_id = item["product_id"]
            qty = int(item["quantity"])
            if qty <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid quantity for product {prod_id}.",
                )

            product = product_map[prod_id]

            # Enforce availability
            if not product.get("is_available", True):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product '{product['name']}' is currently unavailable.",
                )

            unit_price = float(product["price"])
            item_subtotal = round(unit_price * qty, 2)
            subtotal += item_subtotal

            # Snapshot product name and unit price at time of order
            calculated_items.append({
                "product_id": prod_id,
                "product_name": product["name"],
                "quantity": qty,
                "unit_price": unit_price,
                "subtotal": item_subtotal,
            })

        subtotal = round(subtotal, 2)

        # 5. Apply tax if configured in café settings
        tax = 0.0
        tax_settings = cafe.get("tax_settings") or {}
        if tax_settings.get("tax_enabled") and tax_settings.get("tax_rate_percent", 0) > 0:
            rate = float(tax_settings["tax_rate_percent"])
            tax = round((subtotal * rate) / 100.0, 2)

        total = round(subtotal + tax, 2)

        # 6. Generate order numbers and record
        order_id = generate_id("ord")
        order_number = await self.order_repo.get_next_order_number(cafe_id)
        order_reference = generate_order_reference()

        order_record = {
            "order_id": order_id,
            "order_number": order_number,
            "order_reference": order_reference,
            "cafe_id": cafe_id,
            "table_id": table_id,
            "table_number": table_number,
            "order_type": order_data.get("order_type", "DINE_IN"),
            "customer_name": order_data.get("customer_name"),
            "customer_phone": order_data.get("customer_phone"),
            "items": calculated_items,
            "subtotal": subtotal,
            "tax": tax,
            "discount": 0.0,
            "total": total,
            "payment_status": "PENDING",
            "order_status": "PLACED",
            "idempotency_key": idempotency_key,
        }

        created = await self.order_repo.create(order_record)
        # Authoritative DB write succeeded; publish real-time notification
        try:
            await self.ably_service.publish_new_order(created)
        except Exception as e:
            logger.error(f"Failed to publish NEW_ORDER via Ably: {e}")
        return created

    async def _enrich_order_table(self, cafe_id: str, order: Dict[str, Any]) -> None:
        """Resolve table_number if missing and ensure timezone on created_at."""
        if not order.get("table_number") and order.get("table_id"):
            table = await self.table_repo.get_by_id(cafe_id, order["table_id"])
            if table:
                order["table_number"] = table.get("table_number")

        # Guarantee UTC timezone awareness on created_at and updated_at
        created_at = order.get("created_at")
        if isinstance(created_at, datetime) and created_at.tzinfo is None:
            order["created_at"] = created_at.replace(tzinfo=timezone.utc)
        elif not created_at:
            order["created_at"] = order.get("updated_at") or datetime.now(timezone.utc)

        updated_at = order.get("updated_at")
        if isinstance(updated_at, datetime) and updated_at.tzinfo is None:
            order["updated_at"] = updated_at.replace(tzinfo=timezone.utc)
        elif not updated_at:
            order["updated_at"] = order.get("created_at")

    async def get_order_by_reference(self, order_reference: str) -> Dict[str, Any]:
        """Public order tracking endpoint for customers using secure unguessable reference."""
        order = await self.order_repo.get_by_reference(order_reference)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
        await self._enrich_order_table(order.get("cafe_id", ""), order)
        return order

    async def list_orders(
        self, cafe_id: str, status: Optional[str] = None, limit: int = 50, skip: int = 0
    ) -> List[Dict[str, Any]]:
        orders = await self.order_repo.get_all(cafe_id, status=status, limit=limit, skip=skip)
        for o in orders:
            await self._enrich_order_table(cafe_id, o)
        return orders

    async def get_order(self, cafe_id: str, order_id: str) -> Dict[str, Any]:
        order = await self.order_repo.get_by_id(cafe_id, order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
        await self._enrich_order_table(cafe_id, order)
        return order

    async def update_order_status(
        self, cafe_id: str, order_id: str, new_status: str
    ) -> Dict[str, Any]:
        order = await self.get_order(cafe_id, order_id)
        current_status = order["order_status"]

        allowed_next_statuses = VALID_TRANSITIONS.get(current_status, [])
        if new_status not in allowed_next_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status transition from {current_status} to {new_status}.",
            )

        updated = await self.order_repo.update_status(cafe_id, order_id, new_status)
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

        # Authoritative DB update succeeded; publish status event
        try:
            await self.ably_service.publish_order_status_update(updated, new_status)
        except Exception as e:
            logger.error(f"Failed to publish ORDER_{new_status} via Ably: {e}")
        return updated

    async def get_dashboard_stats(self, cafe_id: str) -> Dict[str, int]:
        return await self.order_repo.get_dashboard_stats(cafe_id)
