from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy import (
    Column,
    String,
    Integer,
    BigInteger,
    Float,
    DateTime,
    Text,
    ForeignKey,
    UniqueConstraint,
    Index,
    func,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class OrderSequence(Base):
    """
    Atomic tenant-scoped sequence tracker for cafe order numbers.
    Guarantees concurrency-safe sequential order numbering (1001, 1002, 1003...) per cafe.
    """
    __tablename__ = "order_sequences"

    cafe_id = Column(String(100), primary_key=True)
    last_order_number = Column(Integer, nullable=False, default=1000)


class Order(Base):
    """
    Authoritative order entity in PostgreSQL.
    Immutable snapshots of financial totals and status machine progression.
    """
    __tablename__ = "orders"

    id = Column(Integer().with_variant(BigInteger, "postgresql"), primary_key=True, autoincrement=True)
    order_id = Column(String(50), unique=True, nullable=False, index=True)
    order_number = Column(String(20), nullable=False)
    order_reference = Column(String(60), unique=True, nullable=False, index=True)
    cafe_id = Column(String(100), nullable=False, index=True)
    table_id = Column(String(100), nullable=True)
    table_number = Column(String(50), nullable=True)
    order_type = Column(String(20), nullable=False, default="DINE_IN")
    customer_name = Column(String(100), nullable=True)
    customer_phone = Column(String(30), nullable=True)
    subtotal = Column(Float, nullable=False, default=0.0)
    tax = Column(Float, nullable=False, default=0.0)
    discount = Column(Float, nullable=False, default=0.0)
    total = Column(Float, nullable=False, default=0.0)
    payment_status = Column(String(20), nullable=False, default="PENDING")
    order_status = Column(String(20), nullable=False, default="PLACED")
    idempotency_key = Column(String(100), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("cafe_id", "order_number", name="uq_orders_cafe_order_number"),
        Index("idx_orders_cafe_created", "cafe_id", "created_at"),
        Index("idx_orders_cafe_status", "cafe_id", "order_status"),
        Index("idx_orders_cafe_idempotency", "cafe_id", "idempotency_key"),
    )

    items = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="OrderItem.id",
    )
    status_history = relationship(
        "OrderStatusHistory",
        back_populates="order",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="OrderStatusHistory.created_at",
    )

    def to_dict(self) -> Dict[str, Any]:
        c_at = self.created_at
        if c_at and c_at.tzinfo is None:
            c_at = c_at.replace(tzinfo=timezone.utc)
        elif not c_at:
            c_at = datetime.now(timezone.utc)

        u_at = self.updated_at
        if u_at and u_at.tzinfo is None:
            u_at = u_at.replace(tzinfo=timezone.utc)
        elif not u_at:
            u_at = c_at

        return {
            "order_id": self.order_id,
            "order_number": self.order_number,
            "order_reference": self.order_reference,
            "cafe_id": self.cafe_id,
            "table_id": self.table_id,
            "table_number": self.table_number,
            "order_type": self.order_type,
            "customer_name": self.customer_name,
            "customer_phone": self.customer_phone,
            "items": [item.to_dict() for item in (self.items or [])],
            "subtotal": round(float(self.subtotal), 2),
            "tax": round(float(self.tax), 2),
            "discount": round(float(self.discount or 0.0), 2),
            "total": round(float(self.total), 2),
            "payment_status": self.payment_status,
            "order_status": self.order_status,
            "idempotency_key": self.idempotency_key,
            "created_at": c_at,
            "updated_at": u_at,
        }


class OrderItem(Base):
    """
    Immutable product snapshot at the moment the order is created.
    Historical price and product details do not change if catalog updates.
    """
    __tablename__ = "order_items"

    id = Column(Integer().with_variant(BigInteger, "postgresql"), primary_key=True, autoincrement=True)
    order_id = Column(String(50), ForeignKey("orders.order_id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(100), nullable=False)
    product_name = Column(String(200), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)
    addons_total = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    order = relationship("Order", back_populates="items")
    addons = relationship(
        "OrderItemAddon",
        back_populates="order_item",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="OrderItemAddon.id",
    )

    def to_dict(self) -> Dict[str, Any]:
        res: Dict[str, Any] = {
            "product_id": self.product_id,
            "product_name": self.product_name,
            "quantity": self.quantity,
            "unit_price": round(float(self.unit_price), 2),
            "subtotal": round(float(self.subtotal), 2),
            "addons_total": round(float(self.addons_total or 0.0), 2),
        }
        if self.addons:
            res["addons"] = [a.to_dict() for a in self.addons]
        else:
            res["addons"] = []
        return res


class OrderItemAddon(Base):
    """
    Immutable addon snapshot at the moment the order is created.
    """
    __tablename__ = "order_item_addons"

    id = Column(Integer().with_variant(BigInteger, "postgresql"), primary_key=True, autoincrement=True)
    order_item_id = Column(Integer().with_variant(BigInteger, "postgresql"), ForeignKey("order_items.id", ondelete="CASCADE"), nullable=False, index=True)
    addon_group_id = Column(String(100), nullable=False)
    addon_group_name = Column(String(200), nullable=False, default="")
    addon_item_id = Column(String(100), nullable=False)
    addon_item_name = Column(String(200), nullable=False, default="")
    price = Column(Float, nullable=False, default=0.0)

    order_item = relationship("OrderItem", back_populates="addons")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "addon_group_id": self.addon_group_id,
            "addon_group_name": self.addon_group_name,
            "addon_item_id": self.addon_item_id,
            "addon_item_name": self.addon_item_name,
            "price": round(float(self.price), 2),
        }


class OrderStatusHistory(Base):
    """
    Audit log of every valid order status transition with timestamps and actor.
    """
    __tablename__ = "order_status_history"

    id = Column(Integer().with_variant(BigInteger, "postgresql"), primary_key=True, autoincrement=True)
    order_id = Column(String(50), ForeignKey("orders.order_id", ondelete="CASCADE"), nullable=False, index=True)
    from_status = Column(String(20), nullable=True)
    to_status = Column(String(20), nullable=False)
    changed_by = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)

    order = relationship("Order", back_populates="status_history")

    def to_dict(self) -> Dict[str, Any]:
        c_at = self.created_at
        if c_at and c_at.tzinfo is None:
            c_at = c_at.replace(tzinfo=timezone.utc)
        elif not c_at:
            c_at = datetime.now(timezone.utc)

        return {
            "id": self.id,
            "order_id": self.order_id,
            "from_status": self.from_status,
            "to_status": self.to_status,
            "changed_by": self.changed_by,
            "notes": self.notes,
            "created_at": c_at,
        }
