from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text, case
from sqlalchemy.orm import selectinload
from app.models.order import (
    Order,
    OrderItem,
    OrderItemAddon,
    OrderStatusHistory,
    OrderSequence,
)


class OrderRepository:
    """
    PostgreSQL-backed Order Repository.
    Single source of truth for orders, order items, addons, status history, and dashboard metrics.
    Strictly multi-tenant isolated by cafe_id.
    """

    def __init__(self, session: AsyncSession):
        self.session = session

    def _base_order_query(self):
        """Pre-loads items, addons, and status history eagerly to avoid detached lazy-loads."""
        return select(Order).options(
            selectinload(Order.items).selectinload(OrderItem.addons),
            selectinload(Order.status_history),
        )

    async def get_all(
        self,
        cafe_id: str,
        status: Optional[str] = None,
        limit: int = 50,
        skip: int = 0,
        days: int = 60,
    ) -> List[Dict[str, Any]]:
        """
        Lists orders for a cafe with 60-day query boundary per business requirement.
        Sorted newest first.
        """
        since = datetime.now(timezone.utc) - timedelta(days=days)
        query = (
            self._base_order_query()
            .where(Order.cafe_id == cafe_id)
            .where(Order.created_at >= since)
        )
        if status and status != "ALL":
            query = query.where(Order.order_status == status)

        query = query.order_by(Order.created_at.desc()).offset(skip).limit(limit)
        result = await self.session.execute(query)
        orders = result.scalars().all()
        return [o.to_dict() for o in orders]

    async def get_by_id(self, cafe_id: str, order_id: str) -> Optional[Dict[str, Any]]:
        """Fetches order by ID strictly scoped to cafe_id for multi-tenant isolation."""
        query = (
            self._base_order_query()
            .where(Order.cafe_id == cafe_id)
            .where(Order.order_id == order_id)
        )
        result = await self.session.execute(query)
        order = result.scalar_one_or_none()
        return order.to_dict() if order else None

    async def get_by_reference(self, order_reference: str) -> Optional[Dict[str, Any]]:
        """Public customer lookup via unguessable order_reference."""
        query = (
            self._base_order_query()
            .where(Order.order_reference == order_reference)
        )
        result = await self.session.execute(query)
        order = result.scalar_one_or_none()
        return order.to_dict() if order else None

    async def get_by_idempotency_key(
        self, cafe_id: str, idempotency_key: str
    ) -> Optional[Dict[str, Any]]:
        """Idempotency lookup strictly scoped to cafe_id."""
        query = (
            self._base_order_query()
            .where(Order.cafe_id == cafe_id)
            .where(Order.idempotency_key == idempotency_key)
        )
        result = await self.session.execute(query)
        order = result.scalar_one_or_none()
        return order.to_dict() if order else None

    async def get_next_order_number(self, cafe_id: str) -> str:
        """
        Atomically generate the next sequential order number for the café (e.g. #1001, #1002).
        Uses atomic ON CONFLICT DO UPDATE RETURNING to ensure concurrency safety without collisions.
        """
        stmt = text("""
            INSERT INTO order_sequences (cafe_id, last_order_number)
            VALUES (:cafe_id, 1001)
            ON CONFLICT (cafe_id)
            DO UPDATE SET last_order_number = order_sequences.last_order_number + 1
            RETURNING last_order_number
        """)
        res = await self.session.execute(stmt, {"cafe_id": cafe_id})
        row = res.first()
        if row and row[0] is not None:
            return str(row[0])
        return "1001"

    async def get_dashboard_stats(self, cafe_id: str) -> Dict[str, int]:
        """
        Fetches live counts for the dashboard directly from PostgreSQL.
        Returns genuine counts (0s when empty - strictly no fake numbers).
        """
        now = datetime.now(timezone.utc)
        start_of_day = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

        stmt = select(
            func.coalesce(func.sum(case((Order.created_at >= start_of_day, 1), else_=0)), 0).label("total_today"),
            func.coalesce(func.sum(case((Order.order_status == "PLACED", 1), else_=0)), 0).label("pending"),
            func.coalesce(func.sum(case((Order.order_status == "PREPARING", 1), else_=0)), 0).label("preparing"),
            func.coalesce(func.sum(case((Order.order_status == "READY", 1), else_=0)), 0).label("ready"),
            func.coalesce(func.sum(case((Order.order_status == "COMPLETED", 1), else_=0)), 0).label("completed"),
        ).where(Order.cafe_id == cafe_id)

        res = await self.session.execute(stmt)
        row = res.first()
        if row:
            return {
                "total_orders_today": int(row.total_today),
                "pending_orders": int(row.pending),
                "preparing_orders": int(row.preparing),
                "ready_orders": int(row.ready),
                "completed_orders": int(row.completed),
            }
        return {
            "total_orders_today": 0,
            "pending_orders": 0,
            "preparing_orders": 0,
            "ready_orders": 0,
            "completed_orders": 0,
        }

    async def create(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Persists an order, its items, addon snapshots, and initial status history in PostgreSQL.
        All entities are flushed within the active transaction.
        """
        now = datetime.now(timezone.utc)
        created_at = order_data.get("created_at") or now
        if isinstance(created_at, datetime) and created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)

        order = Order(
            order_id=order_data["order_id"],
            order_number=str(order_data["order_number"]),
            order_reference=order_data["order_reference"],
            cafe_id=order_data["cafe_id"],
            table_id=order_data.get("table_id"),
            table_number=order_data.get("table_number"),
            order_type=order_data.get("order_type", "DINE_IN"),
            customer_name=order_data.get("customer_name"),
            customer_phone=order_data.get("customer_phone"),
            subtotal=float(order_data["subtotal"]),
            tax=float(order_data.get("tax", 0.0)),
            discount=float(order_data.get("discount", 0.0)),
            total=float(order_data["total"]),
            payment_status=order_data.get("payment_status", "PENDING"),
            order_status=order_data.get("order_status", "PLACED"),
            idempotency_key=order_data.get("idempotency_key"),
            created_at=created_at,
            updated_at=created_at,
        )
        self.session.add(order)
        await self.session.flush()

        for itm in order_data.get("items", []):
            order_item = OrderItem(
                order_id=order.order_id,
                product_id=itm["product_id"],
                product_name=itm["product_name"],
                quantity=int(itm["quantity"]),
                unit_price=float(itm["unit_price"]),
                subtotal=float(itm["subtotal"]),
                addons_total=float(itm.get("addons_total", 0.0)),
                created_at=created_at,
            )
            self.session.add(order_item)
            await self.session.flush()

            for add in itm.get("addons", []):
                addon_rec = OrderItemAddon(
                    order_item_id=order_item.id,
                    addon_group_id=add.get("addon_group_id", ""),
                    addon_group_name=add.get("addon_group_name", ""),
                    addon_item_id=add.get("addon_item_id", ""),
                    addon_item_name=add.get("addon_item_name", ""),
                    price=float(add.get("price", 0.0)),
                )
                self.session.add(addon_rec)

        # Record initial status transition in history
        history = OrderStatusHistory(
            order_id=order.order_id,
            from_status=None,
            to_status=order.order_status,
            changed_by=order_data.get("customer_name") or "CUSTOMER",
            notes="Initial order placement",
            created_at=created_at,
        )
        self.session.add(history)
        await self.session.flush()

        # Re-fetch order with eager-loaded items & addons for clean return dict
        query = self._base_order_query().where(Order.order_id == order.order_id)
        res = await self.session.execute(query)
        persisted = res.scalar_one()
        return persisted.to_dict()

    async def update_status(
        self,
        cafe_id: str,
        order_id: str,
        new_status: str,
        changed_by: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Advances order status, records the transition in order_status_history,
        and returns the updated order dict.
        """
        query = self._base_order_query().where(
            Order.cafe_id == cafe_id,
            Order.order_id == order_id,
        )
        result = await self.session.execute(query)
        order = result.scalar_one_or_none()
        if not order:
            return None

        old_status = order.order_status
        now = datetime.now(timezone.utc)
        order.order_status = new_status
        order.updated_at = now

        history = OrderStatusHistory(
            order_id=order.order_id,
            from_status=old_status,
            to_status=new_status,
            changed_by=changed_by or "STAFF",
            notes=notes or f"Status changed from {old_status} to {new_status}",
            created_at=now,
        )
        self.session.add(history)
        await self.session.flush()

        return order.to_dict()

    async def get_status_history(
        self, cafe_id: str, order_id: str
    ) -> List[Dict[str, Any]]:
        """Returns the audit trail of status transitions for an order."""
        # Ensure order belongs to cafe
        order_check = await self.get_by_id(cafe_id, order_id)
        if not order_check:
            return []

        query = (
            select(OrderStatusHistory)
            .where(OrderStatusHistory.order_id == order_id)
            .order_by(OrderStatusHistory.created_at.asc())
        )
        res = await self.session.execute(query)
        records = res.scalars().all()
        return [r.to_dict() for r in records]


# Alias for explicit naming
PostgresOrderRepository = OrderRepository
