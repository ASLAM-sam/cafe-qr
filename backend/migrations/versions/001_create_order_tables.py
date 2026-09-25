"""create order tables

Revision ID: 001_create_order_tables
Revises: 
Create Date: 2026-09-25 17:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_create_order_tables'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. order_sequences table for atomic per-cafe sequential numbering
    op.create_table(
        'order_sequences',
        sa.Column('cafe_id', sa.String(length=100), nullable=False),
        sa.Column('last_order_number', sa.Integer(), nullable=False, server_default='1000'),
        sa.PrimaryKeyConstraint('cafe_id')
    )

    # 2. orders table
    op.create_table(
        'orders',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('order_id', sa.String(length=50), nullable=False),
        sa.Column('order_number', sa.String(length=20), nullable=False),
        sa.Column('order_reference', sa.String(length=60), nullable=False),
        sa.Column('cafe_id', sa.String(length=100), nullable=False),
        sa.Column('table_id', sa.String(length=100), nullable=True),
        sa.Column('table_number', sa.String(length=50), nullable=True),
        sa.Column('order_type', sa.String(length=20), nullable=False, server_default='DINE_IN'),
        sa.Column('customer_name', sa.String(length=100), nullable=True),
        sa.Column('customer_phone', sa.String(length=30), nullable=True),
        sa.Column('subtotal', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('tax', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('discount', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('total', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('payment_status', sa.String(length=20), nullable=False, server_default='PENDING'),
        sa.Column('order_status', sa.String(length=20), nullable=False, server_default='PLACED'),
        sa.Column('idempotency_key', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('order_id'),
        sa.UniqueConstraint('order_reference'),
        sa.UniqueConstraint('cafe_id', 'order_number', name='uq_orders_cafe_order_number')
    )
    op.create_index('idx_orders_order_id', 'orders', ['order_id'], unique=True)
    op.create_index('idx_orders_order_ref', 'orders', ['order_reference'], unique=True)
    op.create_index('idx_orders_cafe_created', 'orders', ['cafe_id', 'created_at'], unique=False)
    op.create_index('idx_orders_cafe_status', 'orders', ['cafe_id', 'order_status'], unique=False)
    op.create_index('idx_orders_cafe_idempotency', 'orders', ['cafe_id', 'idempotency_key'], unique=False)

    # 3. order_items table
    op.create_table(
        'order_items',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('order_id', sa.String(length=50), nullable=False),
        sa.Column('product_id', sa.String(length=100), nullable=False),
        sa.Column('product_name', sa.String(length=200), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit_price', sa.Float(), nullable=False),
        sa.Column('subtotal', sa.Float(), nullable=False),
        sa.Column('addons_total', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['order_id'], ['orders.order_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_order_items_order_id', 'order_items', ['order_id'], unique=False)

    # 4. order_item_addons table
    op.create_table(
        'order_item_addons',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('order_item_id', sa.BigInteger(), nullable=False),
        sa.Column('addon_group_id', sa.String(length=100), nullable=False),
        sa.Column('addon_group_name', sa.String(length=200), nullable=False, server_default=''),
        sa.Column('addon_item_id', sa.String(length=100), nullable=False),
        sa.Column('addon_item_name', sa.String(length=200), nullable=False, server_default=''),
        sa.Column('price', sa.Float(), nullable=False, server_default='0.0'),
        sa.ForeignKeyConstraint(['order_item_id'], ['order_items.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_order_item_addons_item_id', 'order_item_addons', ['order_item_id'], unique=False)

    # 5. order_status_history table
    op.create_table(
        'order_status_history',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('order_id', sa.String(length=50), nullable=False),
        sa.Column('from_status', sa.String(length=20), nullable=True),
        sa.Column('to_status', sa.String(length=20), nullable=False),
        sa.Column('changed_by', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['order_id'], ['orders.order_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_order_status_history_order_id', 'order_status_history', ['order_id'], unique=False)


def downgrade() -> None:
    op.drop_table('order_status_history')
    op.drop_table('order_item_addons')
    op.drop_table('order_items')
    op.drop_table('orders')
    op.drop_table('order_sequences')
