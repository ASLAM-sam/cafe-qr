import asyncio
import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from app.repositories.order_repository import OrderRepository


@pytest.mark.asyncio
async def test_order_number_atomic_concurrency(pg_test_engine):
    """
    Verify that 100 simultaneous concurrent requests to generate order numbers
    using the atomic sequence increment on PostgreSQL result in
    100 completely unique, sequential order numbers for a cafe without collisions.
    """
    session_factory = async_sessionmaker(
        bind=pg_test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    cafe_id = "cafe_concurrency_test"

    async def get_number():
        async with session_factory() as session:
            repo = OrderRepository(session)
            num = await repo.get_next_order_number(cafe_id)
            await session.commit()
            return num

    # Launch 100 concurrent tasks simultaneously
    order_numbers = await asyncio.gather(*(get_number() for _ in range(100)))

    # Assert exactly 100 order numbers returned
    assert len(order_numbers) == 100

    # Assert every single order number is unique
    unique_numbers = set(order_numbers)
    assert len(unique_numbers) == 100, f"Collisions detected: {len(order_numbers) - len(unique_numbers)}"

    # Assert correct sequential format (1001 through 1100)
    assert "1001" in unique_numbers
    assert "1100" in unique_numbers


@pytest.mark.asyncio
async def test_order_number_per_cafe_isolation(pg_session):
    """
    Verify that sequence counters are strictly partitioned by cafe_id.
    Cafe A and Cafe B both start at 1001 independently.
    """
    repo = OrderRepository(pg_session)

    num_a1 = await repo.get_next_order_number("cafe_alpha")
    num_b1 = await repo.get_next_order_number("cafe_beta")
    num_a2 = await repo.get_next_order_number("cafe_alpha")

    assert num_a1 == "1001"
    assert num_b1 == "1001"
    assert num_a2 == "1002"


@pytest.mark.asyncio
async def test_order_idempotency_duplicate_protection(async_client, auth_headers_a):
    """
    Verify that duplicate order placement with the same idempotency_key returns
    the existing order rather than creating duplicate orders in the database.
    """
    # 1. Setup table
    tbl_res = await async_client.post(
        "/api/tables",
        json={"table_number": "T-Idem-1"},
        headers=auth_headers_a,
    )
    table_token = tbl_res.json()["qr_token"]

    # 2. Setup category and product
    cat_res = await async_client.post(
        "/api/categories",
        json={"name": "Beverages"},
        headers=auth_headers_a,
    )
    cat_id = cat_res.json()["category_id"]

    prod_res = await async_client.post(
        "/api/products",
        json={"category_id": cat_id, "name": "Iced Tea", "price": 80.0, "is_available": True},
        headers=auth_headers_a,
    )
    prod_id = prod_res.json()["product_id"]

    order_payload = {
        "table_token": table_token,
        "order_type": "DINE_IN",
        "items": [{"product_id": prod_id, "quantity": 2}],
    }

    # 3. First submission with idempotency key
    idem_key = "idemp_test_key_abc_123"
    res1 = await async_client.post(
        "/api/public/orders",
        json=order_payload,
        headers={"X-Tenant-Subdomain": "brewhouse", "Idempotency-Key": idem_key},
    )
    assert res1.status_code == 201
    order1 = res1.json()
    order_id_1 = order1["order_id"]

    # 4. Immediate duplicate submission with SAME idempotency key (simulating double click or network retry)
    res2 = await async_client.post(
        "/api/public/orders",
        json=order_payload,
        headers={"X-Tenant-Subdomain": "brewhouse", "Idempotency-Key": idem_key},
    )
    assert res2.status_code in (200, 201)
    order2 = res2.json()

    # Must return the SAME order without creating a second record
    assert order2["order_id"] == order_id_1
    assert order2["order_number"] == order1["order_number"]

    # 5. Third submission with DIFFERENT idempotency key (legitimate second order)
    res3 = await async_client.post(
        "/api/public/orders",
        json=order_payload,
        headers={"X-Tenant-Subdomain": "brewhouse", "Idempotency-Key": "idemp_test_key_xyz_999"},
    )
    assert res3.status_code == 201
    order3 = res3.json()
    assert order3["order_id"] != order_id_1


@pytest.mark.asyncio
async def test_50_concurrent_complete_orders(pg_test_engine):
    """
    Step 9: Verify 50 concurrent complete orders placed in PostgreSQL.
    All 50 receive sequential numbers #1001 through #1050 without collision, race conditions, or missing numbers.
    """
    session_factory = async_sessionmaker(
        bind=pg_test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    cafe_id = "cafe_50_concurrency"

    async def place_order(i: int):
        async with session_factory() as session:
            repo = OrderRepository(session)
            num = await repo.get_next_order_number(cafe_id)
            order_data = {
                "order_id": f"ord_concurrent_{i}_{num}",
                "order_number": num,
                "order_reference": f"ref_concurrent_{i}_{num}",
                "cafe_id": cafe_id,
                "order_type": "DINE_IN",
                "subtotal": 100.0,
                "tax": 5.0,
                "discount": 0.0,
                "total": 105.0,
                "items": [
                    {
                        "product_id": f"prod_{i}",
                        "product_name": f"Item {i}",
                        "quantity": 1,
                        "unit_price": 100.0,
                        "subtotal": 100.0,
                    }
                ],
            }
            order = await repo.create(order_data)
            await session.commit()
            return order

    orders = await asyncio.gather(*(place_order(i) for i in range(50)))
    assert len(orders) == 50
    order_numbers = [int(o["order_number"]) for o in orders]
    assert len(set(order_numbers)) == 50, "Every order number must be unique"
    assert sorted(order_numbers) == list(range(1001, 1051)), "Order numbers must be contiguous from 1001 to 1050"
