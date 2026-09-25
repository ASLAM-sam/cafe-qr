import asyncio
from datetime import datetime, timezone, timedelta
from unittest.mock import patch
import pytest
from sqlalchemy import select, func
from app.models.order import Order, OrderItem, OrderItemAddon, OrderStatusHistory
from app.repositories.order_repository import OrderRepository
from app.core.rate_limit import order_rate_limiter


@pytest.fixture(autouse=True)
def reset_rate_limiters():
    """Reset rate limiter buckets before each test to prevent 429 in rapid test execution."""
    order_rate_limiter.client_records.clear()
    yield
    order_rate_limiter.client_records.clear()


@pytest.mark.asyncio
async def test_1_order_creation_persists_in_postgres(async_client, auth_headers_a, pg_session):
    """Test 1 — Order Creation: Create order -> PostgreSQL -> Order exists with relations."""
    cat_res = await async_client.post("/api/categories", json={"name": "Burgers"}, headers=auth_headers_a)
    cat_id = cat_res.json()["category_id"]
    prod_res = await async_client.post(
        "/api/products",
        json={"category_id": cat_id, "name": "Classic Burger", "price": 120.0},
        headers=auth_headers_a,
    )
    prod_id = prod_res.json()["product_id"]

    order_res = await async_client.post(
        "/api/public/orders",
        json={
            "order_type": "TAKEAWAY",
            "customer_name": "Arjun",
            "items": [{"product_id": prod_id, "quantity": 2}],
        },
        headers={"X-Tenant-Subdomain": "brewhouse"},
    )
    assert order_res.status_code == 201
    data = order_res.json()
    order_id = data["order_id"]

    # Verify directly against PostgreSQL session
    q = select(Order).where(Order.order_id == order_id)
    res = await pg_session.execute(q)
    db_order = res.scalar_one_or_none()
    assert db_order is not None
    assert db_order.cafe_id == "cafe_001"
    assert db_order.order_number == "1001"
    assert db_order.customer_name == "Arjun"
    assert db_order.subtotal == 240.0
    assert len(db_order.items) == 1
    assert db_order.items[0].product_name == "Classic Burger"
    assert db_order.items[0].quantity == 2


@pytest.mark.asyncio
async def test_2_product_snapshot_immutability(async_client, auth_headers_a):
    """
    Test 2 — Product Snapshot:
    Product = ₹180 -> Create order -> Product changes to ₹220 -> Order remains ₹180.
    """
    cat_res = await async_client.post("/api/categories", json={"name": "Specialties"}, headers=auth_headers_a)
    cat_id = cat_res.json()["category_id"]
    prod_res = await async_client.post(
        "/api/products",
        json={"category_id": cat_id, "name": "Chicken Burger", "price": 180.0},
        headers=auth_headers_a,
    )
    prod_id = prod_res.json()["product_id"]

    order_res = await async_client.post(
        "/api/public/orders",
        json={
            "order_type": "TAKEAWAY",
            "items": [{"product_id": prod_id, "quantity": 1}],
        },
        headers={"X-Tenant-Subdomain": "brewhouse"},
    )
    assert order_res.status_code == 201
    order_data = order_res.json()
    order_id = order_data["order_id"]
    assert order_data["items"][0]["unit_price"] == 180.0
    assert order_data["subtotal"] == 180.0
    assert order_data["total"] == 189.0

    # Update product price in MongoDB to ₹220
    await async_client.put(
        f"/api/products/{prod_id}",
        json={"name": "Chicken Burger", "price": 220.0, "category_id": cat_id, "is_available": True},
        headers=auth_headers_a,
    )

    # Historical order in PostgreSQL must remain ₹180
    fetched_order = await async_client.get(f"/api/orders/{order_id}", headers=auth_headers_a)
    assert fetched_order.status_code == 200
    h_order = fetched_order.json()
    assert h_order["items"][0]["unit_price"] == 180.0
    assert h_order["items"][0]["subtotal"] == 180.0
    assert h_order["subtotal"] == 180.0
    assert h_order["total"] == 189.0


@pytest.mark.asyncio
async def test_3_addon_snapshot_immutability(async_client, auth_headers_a):
    """
    Test 3 — Addon Snapshot:
    Verify addon name and price remain historically correct even if addon group is modified.
    """
    cat_res = await async_client.post("/api/categories", json={"name": "Sides"}, headers=auth_headers_a)
    prod_res = await async_client.post(
        "/api/products",
        json={"category_id": cat_res.json()["category_id"], "name": "Fries", "price": 90.0},
        headers=auth_headers_a,
    )
    prod_id = prod_res.json()["product_id"]

    ag_res = await async_client.post(
        "/api/addons",
        json={
            "name": "Dip Options",
            "min_selections": 0,
            "max_selections": 2,
            "product_ids": [prod_id],
            "items": [
                {"name": "Peri Peri Mayo", "price": 25.0, "is_available": True},
            ],
        },
        headers=auth_headers_a,
    )
    ag_data = ag_res.json()
    ag_id = ag_data["addon_group_id"]
    item_id = ag_data["items"][0]["addon_item_id"]

    order_res = await async_client.post(
        "/api/public/orders",
        json={
            "order_type": "TAKEAWAY",
            "items": [
                {
                    "product_id": prod_id,
                    "quantity": 1,
                    "addons": [{"addon_group_id": ag_id, "addon_item_id": item_id}],
                }
            ],
        },
        headers={"X-Tenant-Subdomain": "brewhouse"},
    )
    assert order_res.status_code == 201
    order_id = order_res.json()["order_id"]

    # Update addon price in MongoDB to ₹50
    await async_client.put(
        f"/api/addons/{ag_id}",
        json={
            "name": "Gourmet Dip Options",
            "min_selections": 0,
            "max_selections": 2,
            "product_ids": [prod_id],
            "items": [
                {"addon_item_id": item_id, "name": "Peri Peri Mayo Luxury", "price": 50.0, "is_available": True},
            ],
        },
        headers=auth_headers_a,
    )

    # Historical order in PostgreSQL retains snapshot of original name and ₹25 price
    h_res = await async_client.get(f"/api/orders/{order_id}", headers=auth_headers_a)
    assert h_res.status_code == 200
    h_order = h_res.json()
    addon_snap = h_order["items"][0]["addons"][0]
    assert addon_snap["addon_group_name"] == "Dip Options"
    assert addon_snap["addon_item_name"] == "Peri Peri Mayo"
    assert addon_snap["price"] == 25.0


@pytest.mark.asyncio
async def test_4_tenant_isolation_orders(async_client, auth_headers_a, auth_headers_b):
    """Test 4 — Tenant Isolation: Cafe B admin cannot view or alter Cafe A's order."""
    cat = await async_client.post("/api/categories", json={"name": "Coffee"}, headers=auth_headers_a)
    prod = await async_client.post(
        "/api/products",
        json={"category_id": cat.json()["category_id"], "name": "Americano", "price": 100.0},
        headers=auth_headers_a,
    )
    order_res = await async_client.post(
        "/api/public/orders",
        json={"order_type": "TAKEAWAY", "items": [{"product_id": prod.json()["product_id"], "quantity": 1}]},
        headers={"X-Tenant-Subdomain": "brewhouse"},
    )
    order_a_id = order_res.json()["order_id"]

    # Cafe B admin queries list -> Cafe A order must not appear
    b_list = await async_client.get("/api/orders", headers=auth_headers_b)
    assert b_list.status_code == 200
    assert order_a_id not in [o["order_id"] for o in b_list.json()]

    # Cafe B admin tries to view directly -> 404
    b_view = await async_client.get(f"/api/orders/{order_a_id}", headers=auth_headers_b)
    assert b_view.status_code == 404

    # Cafe B admin tries to update status -> 404
    b_patch = await async_client.patch(
        f"/api/orders/{order_a_id}/status",
        json={"status": "ACCEPTED"},
        headers=auth_headers_b,
    )
    assert b_patch.status_code == 404


@pytest.mark.asyncio
async def test_5_idempotency_duplicate_protection(async_client, auth_headers_a, pg_session):
    """Test 5 — Idempotency: Same key twice returns the exact same order; no duplicate rows in DB."""
    cat = await async_client.post("/api/categories", json={"name": "Tea"}, headers=auth_headers_a)
    prod = await async_client.post(
        "/api/products",
        json={"category_id": cat.json()["category_id"], "name": "Chai", "price": 50.0},
        headers=auth_headers_a,
    )
    prod_id = prod.json()["product_id"]

    idem_key = "idemp_exact_key_test_001"
    req_payload = {
        "order_type": "TAKEAWAY",
        "items": [{"product_id": prod_id, "quantity": 1}],
        "idempotency_key": idem_key,
    }

    # Request 1
    res1 = await async_client.post(
        "/api/public/orders",
        json=req_payload,
        headers={"X-Tenant-Subdomain": "brewhouse"},
    )
    assert res1.status_code == 201
    order1 = res1.json()

    # Request 2 (identical key)
    res2 = await async_client.post(
        "/api/public/orders",
        json=req_payload,
        headers={"X-Tenant-Subdomain": "brewhouse"},
    )
    assert res2.status_code in (200, 201)
    order2 = res2.json()

    assert order1["order_id"] == order2["order_id"]
    assert order1["order_number"] == order2["order_number"]

    # Verify only 1 row in PostgreSQL
    count_stmt = select(func.count(Order.id)).where(
        Order.cafe_id == "cafe_001",
        Order.idempotency_key == idem_key,
    )
    count_res = await pg_session.execute(count_stmt)
    assert count_res.scalar() == 1


@pytest.mark.asyncio
async def test_6_concurrent_orders_unique_sequences(async_client, auth_headers_a):
    """Test 6 — Concurrent Orders: Multiple simultaneous orders have unique order numbers and IDs."""
    cat = await async_client.post("/api/categories", json={"name": "Quick Snacks"}, headers=auth_headers_a)
    prod = await async_client.post(
        "/api/products",
        json={"category_id": cat.json()["category_id"], "name": "Cookies", "price": 30.0},
        headers=auth_headers_a,
    )
    prod_id = prod.json()["product_id"]

    async def place_single_order(i: int):
        return await async_client.post(
            "/api/public/orders",
            json={
                "order_type": "TAKEAWAY",
                "customer_name": f"Customer {i}",
                "items": [{"product_id": prod_id, "quantity": 1}],
            },
            headers={"X-Tenant-Subdomain": "brewhouse", "X-Forwarded-For": f"192.168.1.{i+10}"},
        )

    # Launch 20 concurrent order placements
    responses = await asyncio.gather(*(place_single_order(i) for i in range(20)))
    assert all(r.status_code == 201 for r in responses)

    order_ids = [r.json()["order_id"] for r in responses]
    order_numbers = [r.json()["order_number"] for r in responses]

    assert len(set(order_ids)) == 20, "Order IDs must all be unique"
    assert len(set(order_numbers)) == 20, "Order numbers must all be unique"


@pytest.mark.asyncio
async def test_7_status_transitions_valid_and_invalid(async_client, auth_headers_a):
    """Test 7 — Status Transitions: Verify valid state machine flow and reject invalid transitions."""
    cat = await async_client.post("/api/categories", json={"name": "Juices"}, headers=auth_headers_a)
    prod = await async_client.post(
        "/api/products",
        json={"category_id": cat.json()["category_id"], "name": "Orange Juice", "price": 80.0},
        headers=auth_headers_a,
    )
    order_res = await async_client.post(
        "/api/public/orders",
        json={"order_type": "TAKEAWAY", "items": [{"product_id": prod.json()["product_id"], "quantity": 1}]},
        headers={"X-Tenant-Subdomain": "brewhouse"},
    )
    order_id = order_res.json()["order_id"]

    # Initial: PLACED
    assert order_res.json()["order_status"] == "PLACED"

    # Invalid: PLACED -> READY (must be rejected)
    bad_res = await async_client.patch(
        f"/api/orders/{order_id}/status",
        json={"status": "READY"},
        headers=auth_headers_a,
    )
    assert bad_res.status_code == 400

    # Valid: PLACED -> ACCEPTED -> PREPARING -> READY -> COMPLETED
    s1 = await async_client.patch(f"/api/orders/{order_id}/status", json={"status": "ACCEPTED"}, headers=auth_headers_a)
    assert s1.status_code == 200
    assert s1.json()["order_status"] == "ACCEPTED"

    s2 = await async_client.patch(f"/api/orders/{order_id}/status", json={"status": "PREPARING"}, headers=auth_headers_a)
    assert s2.status_code == 200
    assert s2.json()["order_status"] == "PREPARING"

    s3 = await async_client.patch(f"/api/orders/{order_id}/status", json={"status": "READY"}, headers=auth_headers_a)
    assert s3.status_code == 200
    assert s3.json()["order_status"] == "READY"

    s4 = await async_client.patch(f"/api/orders/{order_id}/status", json={"status": "COMPLETED"}, headers=auth_headers_a)
    assert s4.status_code == 200
    assert s4.json()["order_status"] == "COMPLETED"

    # Terminal state: Cannot transition once COMPLETED
    s5 = await async_client.patch(f"/api/orders/{order_id}/status", json={"status": "CANCELLED"}, headers=auth_headers_a)
    assert s5.status_code == 400


@pytest.mark.asyncio
async def test_8_status_history_records(async_client, auth_headers_a):
    """Test 8 — Status History: Each transition records an audit entry in PostgreSQL."""
    cat = await async_client.post("/api/categories", json={"name": "Sandwiches"}, headers=auth_headers_a)
    prod = await async_client.post(
        "/api/products",
        json={"category_id": cat.json()["category_id"], "name": "Veg Sandwich", "price": 70.0},
        headers=auth_headers_a,
    )
    order_res = await async_client.post(
        "/api/public/orders",
        json={"order_type": "TAKEAWAY", "items": [{"product_id": prod.json()["product_id"], "quantity": 1}]},
        headers={"X-Tenant-Subdomain": "brewhouse"},
    )
    order_id = order_res.json()["order_id"]

    # Transition 1: ACCEPTED
    await async_client.patch(f"/api/orders/{order_id}/status", json={"status": "ACCEPTED"}, headers=auth_headers_a)
    # Transition 2: PREPARING
    await async_client.patch(f"/api/orders/{order_id}/status", json={"status": "PREPARING"}, headers=auth_headers_a)

    # Check via history API endpoint
    hist_res = await async_client.get(f"/api/orders/{order_id}/history", headers=auth_headers_a)
    assert hist_res.status_code == 200
    history = hist_res.json()

    assert len(history) == 3
    # 1. Initial PLACED
    assert history[0]["from_status"] is None
    assert history[0]["to_status"] == "PLACED"
    # 2. PLACED -> ACCEPTED
    assert history[1]["from_status"] == "PLACED"
    assert history[1]["to_status"] == "ACCEPTED"
    # 3. ACCEPTED -> PREPARING
    assert history[2]["from_status"] == "ACCEPTED"
    assert history[2]["to_status"] == "PREPARING"


@pytest.mark.asyncio
async def test_9_customer_tracking_by_reference(async_client, auth_headers_a):
    """Test 9 — Customer Tracking: Order reference lookup works without exposing internal SQL row IDs."""
    cat = await async_client.post("/api/categories", json={"name": "Pastry"}, headers=auth_headers_a)
    prod = await async_client.post(
        "/api/products",
        json={"category_id": cat.json()["category_id"], "name": "Croissant", "price": 60.0},
        headers=auth_headers_a,
    )
    order_res = await async_client.post(
        "/api/public/orders",
        json={"order_type": "TAKEAWAY", "items": [{"product_id": prod.json()["product_id"], "quantity": 1}]},
        headers={"X-Tenant-Subdomain": "brewhouse"},
    )
    order_ref = order_res.json()["order_reference"]

    track_res = await async_client.get(f"/api/public/orders/{order_ref}")
    assert track_res.status_code == 200
    track_data = track_res.json()
    assert track_data["order_reference"] == order_ref
    assert "id" not in track_data  # No internal database row ID exposed!

    # Non-existent reference returns 404
    not_found = await async_client.get("/api/public/orders/non_existent_ref_12345")
    assert not_found.status_code == 404


@pytest.mark.asyncio
async def test_10_60_day_filter_boundary(async_client, auth_headers_a, pg_session):
    """
    Test 10 — 60-Day Filter:
    Orders created within 60 days are visible; orders older than 60 days are excluded from normal history.
    """
    now = datetime.now(timezone.utc)

    # 1. Order within 10 days
    o_recent = Order(
        order_id="ord_recent_10d",
        order_number="1091",
        order_reference="ref_recent_10d",
        cafe_id="cafe_001",
        order_type="TAKEAWAY",
        subtotal=100.0,
        tax=5.0,
        total=105.0,
        payment_status="PENDING",
        order_status="COMPLETED",
        created_at=now - timedelta(days=10),
        updated_at=now - timedelta(days=10),
    )
    # 2. Order near boundary: 59 days ago
    o_boundary = Order(
        order_id="ord_boundary_59d",
        order_number="1092",
        order_reference="ref_boundary_59d",
        cafe_id="cafe_001",
        order_type="TAKEAWAY",
        subtotal=100.0,
        tax=5.0,
        total=105.0,
        payment_status="PENDING",
        order_status="COMPLETED",
        created_at=now - timedelta(days=59),
        updated_at=now - timedelta(days=59),
    )
    # 3. Order outside boundary: 65 days ago
    o_old = Order(
        order_id="ord_old_65d",
        order_number="1093",
        order_reference="ref_old_65d",
        cafe_id="cafe_001",
        order_type="TAKEAWAY",
        subtotal=100.0,
        tax=5.0,
        total=105.0,
        payment_status="PENDING",
        order_status="COMPLETED",
        created_at=now - timedelta(days=65),
        updated_at=now - timedelta(days=65),
    )
    pg_session.add_all([o_recent, o_boundary, o_old])
    await pg_session.commit()

    # Query admin orders list
    res = await async_client.get("/api/orders", headers=auth_headers_a)
    assert res.status_code == 200
    listed_ids = [o["order_id"] for o in res.json()]

    assert "ord_recent_10d" in listed_ids, "Recent order must be visible"
    assert "ord_boundary_59d" in listed_ids, "59-day order must be visible"
    assert "ord_old_65d" not in listed_ids, "65-day order must be excluded by 60-day filter"


@pytest.mark.asyncio
async def test_11_postgres_failure_atomic_rollback(pg_session):
    """Test 11 — PostgreSQL Failure: Atomic rollback leaves no partial records on error."""
    repo = OrderRepository(pg_session)
    order_data = {
        "order_id": "ord_fail_atomic_test",
        "order_number": "9999",
        "order_reference": "ref_fail_atomic_test",
        "cafe_id": "cafe_001",
        "order_type": "TAKEAWAY",
        "subtotal": 100.0,
        "tax": 5.0,
        "discount": 0.0,
        "total": 105.0,
        "items": [
            {
                "product_id": "prod_1",
                "product_name": "Rollback Item",
                "quantity": 1,
                "unit_price": 100.0,
                "subtotal": 100.0,
            }
        ],
    }

    # Simulate error mid-transaction during item creation
    with patch.object(pg_session, "flush", side_effect=[None, RuntimeError("Simulated DB Crash on item insert")]):
        with pytest.raises(RuntimeError):
            await repo.create(order_data)
        await pg_session.rollback()

    # Verify that atomic rollback left 0 rows in orders table
    check = await pg_session.execute(select(Order).where(Order.order_id == "ord_fail_atomic_test"))
    assert check.scalar_one_or_none() is None


@pytest.mark.asyncio
async def test_12_ably_failure_order_persists(async_client, auth_headers_a, pg_session):
    """
    Test 12 — Ably Failure:
    PostgreSQL succeeds. Ably realtime notification fails.
    Expected: Order remains successfully saved in PostgreSQL and returns 201.
    """
    cat = await async_client.post("/api/categories", json={"name": "Beverages"}, headers=auth_headers_a)
    prod = await async_client.post(
        "/api/products",
        json={"category_id": cat.json()["category_id"], "name": "Cold Brew", "price": 140.0},
        headers=auth_headers_a,
    )
    prod_id = prod.json()["product_id"]

    with patch("app.services.ably_service.AblyService.publish_new_order", side_effect=Exception("Ably API Network Timeout")):
        order_res = await async_client.post(
            "/api/public/orders",
            json={"order_type": "TAKEAWAY", "items": [{"product_id": prod_id, "quantity": 1}]},
            headers={"X-Tenant-Subdomain": "brewhouse", "X-Forwarded-For": "10.0.0.99"},
        )
        # Order placement MUST still succeed
        assert order_res.status_code == 201
        order_data = order_res.json()
        order_id = order_data["order_id"]

    # Verify order is committed in PostgreSQL
    q = select(Order).where(Order.order_id == order_id)
    res = await pg_session.execute(q)
    assert res.scalar_one_or_none() is not None


@pytest.mark.asyncio
async def test_13_scenario_b_no_ably_event_when_pg_fails(async_client, auth_headers_a):
    """
    Step 7 Scenario B: MongoDB validation succeeds, PostgreSQL fails mid-transaction.
    Expected:
    - Order is NOT saved in PostgreSQL
    - Ably publish_new_order is NEVER called
    - Proper failure is raised and intercepted without publishing to Ably
    """
    cat = await async_client.post("/api/categories", json={"name": "Tea Test"}, headers=auth_headers_a)
    prod = await async_client.post(
        "/api/products",
        json={"category_id": cat.json()["category_id"], "name": "Earl Grey", "price": 95.0},
        headers=auth_headers_a,
    )
    prod_id = prod.json()["product_id"]

    with patch("app.repositories.order_repository.OrderRepository.create", side_effect=RuntimeError("Simulated PG Storage Failure")):
        with patch("app.services.ably_service.AblyService.publish_new_order") as mock_ably:
            with pytest.raises(RuntimeError):
                await async_client.post(
                    "/api/public/orders",
                    json={"order_type": "TAKEAWAY", "items": [{"product_id": prod_id, "quantity": 1}]},
                    headers={"X-Tenant-Subdomain": "brewhouse", "X-Forwarded-For": "10.0.0.150"},
                )
            mock_ably.assert_not_called()
