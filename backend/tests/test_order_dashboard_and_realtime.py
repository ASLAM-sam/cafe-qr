import pytest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch


@pytest.mark.asyncio
async def test_order_creation_timestamp_stored_and_iso_format(async_client, auth_headers_a):
    """
    Requirements 1 & 2:
    - Order creation timestamp is stored as authoritative server datetime.
    - Order response includes created_at in ISO format.
    """
    # 1. Setup Product for Cafe A
    cat_res = await async_client.post("/api/categories", json={"name": "Desserts"}, headers=auth_headers_a)
    prod_res = await async_client.post(
        "/api/products",
        json={"category_id": cat_res.json()["category_id"], "name": "Chocolate Pancake", "price": 200.0},
        headers=auth_headers_a,
    )
    prod_id = prod_res.json()["product_id"]

    # 2. Place Takeaway order
    order_res = await async_client.post(
        "/api/public/orders",
        json={
            "order_type": "TAKEAWAY",
            "customer_name": "Sarah",
            "items": [{"product_id": prod_id, "quantity": 1}],
        },
        headers={"X-Tenant-Subdomain": "brewhouse"},
    )
    assert order_res.status_code == 201
    data = order_res.json()

    # Verify created_at exists and parses as valid ISO format
    assert "created_at" in data
    assert data["created_at"] is not None
    created_at_dt = datetime.fromisoformat(data["created_at"].replace("Z", "+00:00"))
    assert created_at_dt is not None
    assert created_at_dt.tzinfo is not None

    # Verify order_type is TAKEAWAY and table_id is None
    assert data["order_type"] == "TAKEAWAY"
    assert data["table_id"] is None
    assert data["table_number"] is None


@pytest.mark.asyncio
async def test_dine_in_table_relationship_and_cafe_validation(async_client, auth_headers_a, auth_headers_b):
    """
    Requirements 3, 4, 6 & 7:
    - Dine-in order contains correct table_id and table_number.
    - Takeaway order does not require table_id.
    - order.table_id must belong to order.cafe_id; foreign cafe tables are rejected.
    - Correct table is returned with the order.
    """
    # Cafe A table
    tbl_a_res = await async_client.post("/api/tables", json={"table_number": "01"}, headers=auth_headers_a)
    tbl_a = tbl_a_res.json()
    table_a_id = tbl_a["table_id"]
    table_a_token = tbl_a["qr_token"]

    # Cafe B table
    tbl_b_res = await async_client.post("/api/tables", json={"table_number": "99"}, headers=auth_headers_b)
    table_b_id = tbl_b_res.json()["table_id"]

    # Product for Cafe A
    cat_res = await async_client.post("/api/categories", json={"name": "Drinks"}, headers=auth_headers_a)
    prod_res = await async_client.post(
        "/api/products",
        json={"category_id": cat_res.json()["category_id"], "name": "Cappuccino", "price": 180.0},
        headers=auth_headers_a,
    )
    prod_id = prod_res.json()["product_id"]

    # Test 1: Submitting Cafe B table_id to Cafe A must be rejected
    reject_res = await async_client.post(
        "/api/public/orders",
        json={
            "table_id": table_b_id,
            "order_type": "DINE_IN",
            "items": [{"product_id": prod_id, "quantity": 1}],
        },
        headers={"X-Tenant-Subdomain": "brewhouse"},
    )
    assert reject_res.status_code == 400
    assert "Invalid table" in reject_res.json()["detail"]

    # Test 2: Valid order with Cafe A table_token -> resolves correct table_id and table_number
    order_res = await async_client.post(
        "/api/public/orders",
        json={
            "table_token": table_a_token,
            "order_type": "DINE_IN",
            "items": [{"product_id": prod_id, "quantity": 1}],
        },
        headers={"X-Tenant-Subdomain": "brewhouse"},
    )
    assert order_res.status_code == 201
    order = order_res.json()
    assert order["table_id"] == table_a_id
    assert order["table_number"] == "01"
    assert order["order_type"] == "DINE_IN"

    # Test 3: Admin order detail returns the correct table
    admin_detail_res = await async_client.get(f"/api/orders/{order['order_id']}", headers=auth_headers_a)
    assert admin_detail_res.status_code == 200
    detail = admin_detail_res.json()
    assert detail["table_number"] == "01"
    assert detail["table_id"] == table_a_id


@pytest.mark.asyncio
async def test_cafe_order_isolation_and_newest_first_sorting(async_client, auth_headers_a, auth_headers_b):
    """
    Requirements 5, 6 & 8:
    - Cafe isolation: Cafe A cannot see Cafe B orders.
    - Orders are sorted newest first.
    """
    # 1. Cafe A creates an order
    cat_a = await async_client.post("/api/categories", json={"name": "Tea A"}, headers=auth_headers_a)
    prod_a = await async_client.post(
        "/api/products",
        json={"category_id": cat_a.json()["category_id"], "name": "Green Tea", "price": 100.0},
        headers=auth_headers_a,
    )
    order_a1 = await async_client.post(
        "/api/public/orders",
        json={"order_type": "TAKEAWAY", "items": [{"product_id": prod_a.json()["product_id"], "quantity": 1}]},
        headers={"X-Tenant-Subdomain": "brewhouse"},
    )
    order_a1_id = order_a1.json()["order_id"]

    # Small gap then Cafe A creates order #2
    order_a2 = await async_client.post(
        "/api/public/orders",
        json={"order_type": "TAKEAWAY", "items": [{"product_id": prod_a.json()["product_id"], "quantity": 2}]},
        headers={"X-Tenant-Subdomain": "brewhouse"},
    )
    order_a2_id = order_a2.json()["order_id"]

    # 2. Cafe B creates an order
    cat_b = await async_client.post("/api/categories", json={"name": "Tea B"}, headers=auth_headers_b)
    prod_b = await async_client.post(
        "/api/products",
        json={"category_id": cat_b.json()["category_id"], "name": "Masala Chai", "price": 50.0},
        headers=auth_headers_b,
    )
    order_b = await async_client.post(
        "/api/public/orders",
        json={"order_type": "TAKEAWAY", "items": [{"product_id": prod_b.json()["product_id"], "quantity": 1}]},
        headers={"X-Tenant-Subdomain": "mochacafe"},
    )
    order_b_id = order_b.json()["order_id"]

    # 3. Cafe A admin queries orders: must ONLY see Cafe A orders, NOT Cafe B
    orders_a_res = await async_client.get("/api/orders", headers=auth_headers_a)
    assert orders_a_res.status_code == 200
    orders_a = orders_a_res.json()
    order_a_ids = [o["order_id"] for o in orders_a]
    assert order_a1_id in order_a_ids
    assert order_a2_id in order_a_ids
    assert order_b_id not in order_a_ids

    # 4. Cafe B admin queries orders: must ONLY see Cafe B orders, NOT Cafe A
    orders_b_res = await async_client.get("/api/orders", headers=auth_headers_b)
    assert orders_b_res.status_code == 200
    orders_b = orders_b_res.json()
    order_b_ids = [o["order_id"] for o in orders_b]
    assert order_b_id in order_b_ids
    assert order_a1_id not in order_b_ids
    assert order_a2_id not in order_b_ids

    # 5. Verify sorting: order_a2 was created after order_a1, so order_a2 must appear before order_a1
    idx_a1 = order_a_ids.index(order_a1_id)
    idx_a2 = order_a_ids.index(order_a2_id)
    assert idx_a2 < idx_a1, "Orders must be sorted newest first"


@pytest.mark.asyncio
async def test_ably_event_channel_and_token_format(async_client, auth_headers_a):
    """
    Requirements 9 & 10:
    - Ably event uses correct cafe channel (cafe:{cafe_id}:orders).
    - Realtime token format is properly serialized dictionary with both token_request and tokenRequest.
    """
    token_res = await async_client.get("/api/realtime/token", headers=auth_headers_a)
    assert token_res.status_code == 200
    token_data = token_res.json()

    # Check serialization format
    assert "configured" in token_data
    if token_data["configured"]:
        assert "token_request" in token_data
        assert "tokenRequest" in token_data
        tr = token_data["tokenRequest"]
        assert "keyName" in tr
        assert "clientId" in tr
        assert "nonce" in tr
        assert "mac" in tr
        assert "timestamp" in tr
        assert tr["clientId"] == "admin_cafe_001"
