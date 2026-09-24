import pytest


@pytest.mark.asyncio
async def test_order_creation_and_lifecycle(async_client, auth_headers_a, auth_headers_b):
    # 1. Setup Category and Product for Cafe A (price = 150.0)
    cat_res = await async_client.post(
        "/api/categories",
        json={"name": "Hot Beverages"},
        headers=auth_headers_a,
    )
    cat_id = cat_res.json()["category_id"]

    prod_res = await async_client.post(
        "/api/products",
        json={"category_id": cat_id, "name": "Cappuccino", "price": 150.0, "is_available": True},
        headers=auth_headers_a,
    )
    prod_id = prod_res.json()["product_id"]

    # Setup Table 5 for Cafe A
    tbl_res = await async_client.post(
        "/api/tables",
        json={"table_number": "5"},
        headers=auth_headers_a,
    )
    table_token = tbl_res.json()["qr_token"]

    # 2. Customer places order for 2 Cappuccinos (Subtotal = 300, 5% tax = 15, Total = 315)
    order_payload = {
        "table_token": table_token,
        "order_type": "DINE_IN",
        "customer_name": "Rohan",
        "customer_phone": "9876543210",
        "idempotency_key": "unique_cart_checkout_123",
        "items": [
            {"product_id": prod_id, "quantity": 2}
        ]
    }
    create_res = await async_client.post(
        "/api/public/orders",
        json=order_payload,
        headers={"X-Tenant-Subdomain": "brewhouse"},
    )
    assert create_res.status_code == 201
    order = create_res.json()
    assert order["order_number"] == "1001"
    assert order["subtotal"] == 300.0
    assert order["tax"] == 15.0
    assert order["total"] == 315.0
    assert order["order_status"] == "PLACED"
    order_id = order["order_id"]
    order_ref = order["order_reference"]

    # 3. Idempotency test: submit identical payload with same idempotency_key -> returns same order without duplicates
    dup_res = await async_client.post(
        "/api/public/orders",
        json=order_payload,
        headers={"X-Tenant-Subdomain": "brewhouse"},
    )
    assert dup_res.status_code == 201
    assert dup_res.json()["order_id"] == order_id

    # 4. Customer tracks order via unguessable reference
    track_res = await async_client.get(f"/api/public/orders/{order_ref}")
    assert track_res.status_code == 200
    assert track_res.json()["order_number"] == "1001"

    # 5. Café A admin views orders
    admin_orders_res = await async_client.get("/api/orders", headers=auth_headers_a)
    assert admin_orders_res.status_code == 200
    assert len(admin_orders_res.json()) >= 1

    # 6. Order status state machine: PLACED -> ACCEPTED
    accept_res = await async_client.patch(
        f"/api/orders/{order_id}/status",
        json={"status": "ACCEPTED"},
        headers=auth_headers_a,
    )
    assert accept_res.status_code == 200
    assert accept_res.json()["order_status"] == "ACCEPTED"

    # 7. Invalid transition test: Cannot jump directly from ACCEPTED to COMPLETED
    invalid_res = await async_client.patch(
        f"/api/orders/{order_id}/status",
        json={"status": "COMPLETED"},
        headers=auth_headers_a,
    )
    assert invalid_res.status_code == 400
    assert "Invalid status transition" in invalid_res.json()["detail"]

    # 8. Complete valid lifecycle: ACCEPTED -> PREPARING -> READY -> COMPLETED
    await async_client.patch(f"/api/orders/{order_id}/status", json={"status": "PREPARING"}, headers=auth_headers_a)
    await async_client.patch(f"/api/orders/{order_id}/status", json={"status": "READY"}, headers=auth_headers_a)
    complete_res = await async_client.patch(f"/api/orders/{order_id}/status", json={"status": "COMPLETED"}, headers=auth_headers_a)
    assert complete_res.status_code == 200
    assert complete_res.json()["order_status"] == "COMPLETED"


@pytest.mark.asyncio
async def test_order_rejection_for_other_cafe_product(async_client, auth_headers_b):
    # Cafe B creates a product
    cat_b = await async_client.post("/api/categories", json={"name": "Tea"}, headers=auth_headers_b)
    prod_b = await async_client.post(
        "/api/products",
        json={"category_id": cat_b.json()["category_id"], "name": "Chai", "price": 40.0},
        headers=auth_headers_b,
    )
    prod_b_id = prod_b.json()["product_id"]

    # Customer attempts to order Cafe B's product on Cafe A's domain -> must be REJECTED!
    order_res = await async_client.post(
        "/api/public/orders",
        json={
            "order_type": "TAKEAWAY",
            "items": [{"product_id": prod_b_id, "quantity": 1}],
        },
        headers={"X-Tenant-Subdomain": "brewhouse"},
    )
    assert order_res.status_code == 400
    assert "do not belong to this cafe" in order_res.json()["detail"]


@pytest.mark.asyncio
async def test_dashboard_stats_endpoint(async_client, auth_headers_a):
    res = await async_client.get("/api/admin/dashboard/stats", headers=auth_headers_a)
    assert res.status_code == 200
    data = res.json()
    assert "total_orders_today" in data
    assert "pending_orders" in data
    assert "preparing_orders" in data
    assert "ready_orders" in data
