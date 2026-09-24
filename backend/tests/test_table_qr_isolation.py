import pytest
from datetime import datetime, timezone


@pytest.mark.asyncio
async def test_01_valid_qr_token_resolves_correct_cafe_and_table(async_client, auth_headers_a):
    """1. Valid QR token resolves correct cafe and table."""
    # Create Table 01 in Cafe A (Brew House)
    res_create = await async_client.post(
        "/api/tables",
        json={"table_number": "Table 01"},
        headers=auth_headers_a,
    )
    assert res_create.status_code == 201
    table_data = res_create.json()
    qr_token = table_data["qr_token"]

    # Public resolution
    res_resolve = await async_client.get(f"/api/public/table/{qr_token}")
    assert res_resolve.status_code == 200
    resolved = res_resolve.json()
    assert resolved["table"]["table_number"] == "Table 01"
    assert resolved["table"]["cafe_id"] == "cafe_001"
    assert resolved["cafe"]["name"] == "Brew House"
    assert resolved["cafe"]["subdomain"] == "brewhouse"


@pytest.mark.asyncio
async def test_02_invalid_qr_token_rejected(async_client):
    """2. Invalid QR token rejected with 404 and clean error."""
    res = await async_client.get("/api/public/table/non_existent_token_xyz_999")
    assert res.status_code == 404
    assert res.json()["detail"] == "Invalid table QR code."


@pytest.mark.asyncio
async def test_03_inactive_cafe_rejected(async_client, auth_headers_a, mock_db):
    """3. Inactive cafe rejected with 404."""
    # Create Table
    res_create = await async_client.post(
        "/api/tables",
        json={"table_number": "Table 02"},
        headers=auth_headers_a,
    )
    assert res_create.status_code == 201
    qr_token = res_create.json()["qr_token"]

    # Deactivate Cafe A
    for c in mock_db.cafes.data:
        if c["cafe_id"] == "cafe_001":
            c["status"] = "INACTIVE"

    res_resolve = await async_client.get(f"/api/public/table/{qr_token}")
    assert res_resolve.status_code == 404
    assert "unavailable" in res_resolve.json()["detail"].lower()


@pytest.mark.asyncio
async def test_04_invalid_table_rejected(async_client, auth_headers_a):
    """4. Deleted table token is rejected with 404."""
    # Create Table
    res_create = await async_client.post(
        "/api/tables",
        json={"table_number": "Table Temp"},
        headers=auth_headers_a,
    )
    assert res_create.status_code == 201
    tbl_id = res_create.json()["table_id"]
    qr_token = res_create.json()["qr_token"]

    # Delete Table
    res_del = await async_client.delete(f"/api/tables/{tbl_id}", headers=auth_headers_a)
    assert res_del.status_code == 200

    # Attempt resolution
    res_resolve = await async_client.get(f"/api/public/table/{qr_token}")
    assert res_resolve.status_code == 404
    assert res_resolve.json()["detail"] == "Invalid table QR code."


@pytest.mark.asyncio
async def test_05_token_from_cafe_a_cannot_be_used_for_cafe_b(async_client, auth_headers_a):
    """5. Token from Cafe A cannot be used with Cafe B subdomain / context."""
    res_create = await async_client.post(
        "/api/tables",
        json={"table_number": "Table 03"},
        headers=auth_headers_a,
    )
    assert res_create.status_code == 201
    qr_token_a = res_create.json()["qr_token"]

    # Attempt to resolve Cafe A table under Cafe B (mochacafe) header
    res_mismatch = await async_client.get(
        f"/api/public/table/{qr_token_a}",
        headers={"X-Tenant-Subdomain": "mochacafe"},
    )
    assert res_mismatch.status_code == 400
    assert "does not belong" in res_mismatch.json()["detail"].lower()

    # Query param mismatch
    res_mismatch_param = await async_client.get(
        f"/api/public/table/{qr_token_a}?cafe=mochacafe",
    )
    assert res_mismatch_param.status_code == 400
    assert "does not belong" in res_mismatch_param.json()["detail"].lower()


@pytest.mark.asyncio
async def test_06_order_created_through_cafe_a_qr_belongs_to_cafe_a(async_client, auth_headers_a):
    """6. Order created through Cafe A QR belongs strictly to Cafe A."""
    # Create category & product in Cafe A
    cat_res = await async_client.post(
        "/api/categories",
        json={"name": "Hot Drinks", "display_order": 1},
        headers=auth_headers_a,
    )
    cat_id = cat_res.json()["category_id"]

    prod_res = await async_client.post(
        "/api/products",
        json={"category_id": cat_id, "name": "Latte", "price": 180.0, "is_available": True},
        headers=auth_headers_a,
    )
    prod_id = prod_res.json()["product_id"]

    # Create Table
    tbl_res = await async_client.post(
        "/api/tables",
        json={"table_number": "Table 04"},
        headers=auth_headers_a,
    )
    qr_token = tbl_res.json()["qr_token"]

    # Place Order using table token
    order_res = await async_client.post(
        "/api/public/orders",
        json={
            "table_token": qr_token,
            "order_type": "DINE_IN",
            "customer_name": "Alice",
            "items": [{"product_id": prod_id, "quantity": 2}],
        },
        headers={"X-Tenant-Subdomain": "brewhouse"},
    )
    assert order_res.status_code == 201
    order = order_res.json()
    assert order["cafe_id"] == "cafe_001"
    assert order["table_number"] == "Table 04"
    assert order["total"] == 378.0  # 360 + 5% tax (18) = 378.0


@pytest.mark.asyncio
async def test_07_cafe_b_cannot_access_cafe_a_order(async_client, auth_headers_a, auth_headers_b):
    """7. Cafe B admin cannot access Cafe A order."""
    # Create product in Cafe A
    cat_res = await async_client.post(
        "/api/categories",
        json={"name": "Tea", "display_order": 2},
        headers=auth_headers_a,
    )
    cat_id = cat_res.json()["category_id"]

    prod_res = await async_client.post(
        "/api/products",
        json={"category_id": cat_id, "name": "Chai", "price": 50.0, "is_available": True},
        headers=auth_headers_a,
    )
    prod_id = prod_res.json()["product_id"]

    tbl_res = await async_client.post(
        "/api/tables",
        json={"table_number": "Table 05"},
        headers=auth_headers_a,
    )
    qr_token = tbl_res.json()["qr_token"]

    order_res = await async_client.post(
        "/api/public/orders",
        json={
            "table_token": qr_token,
            "order_type": "DINE_IN",
            "items": [{"product_id": prod_id, "quantity": 1}],
        },
    )
    assert order_res.status_code == 201
    order_id = order_res.json()["order_id"]

    # Cafe B lists orders -> Cafe A order must not appear
    b_orders_res = await async_client.get("/api/admin/orders", headers=auth_headers_b)
    assert b_orders_res.status_code == 200
    b_order_ids = [o["order_id"] for o in b_orders_res.json()]
    assert order_id not in b_order_ids

    # Cafe B gets order directly -> 404
    b_get_order = await async_client.get(f"/api/orders/{order_id}", headers=auth_headers_b)
    assert b_get_order.status_code == 404


@pytest.mark.asyncio
async def test_08_product_from_cafe_b_cannot_be_ordered_through_cafe_a_context(
    async_client, auth_headers_a, auth_headers_b
):
    """8. Product from Cafe B cannot be ordered in Cafe A context."""
    # Cafe B creates product
    cat_b = await async_client.post(
        "/api/categories",
        json={"name": "Mocha Specials", "display_order": 1},
        headers=auth_headers_b,
    )
    prod_b = await async_client.post(
        "/api/products",
        json={
            "category_id": cat_b.json()["category_id"],
            "name": "Mocha Shake",
            "price": 220.0,
            "is_available": True,
        },
        headers=auth_headers_b,
    )
    prod_b_id = prod_b.json()["product_id"]

    # Cafe A table
    tbl_a = await async_client.post(
        "/api/tables",
        json={"table_number": "Table 06"},
        headers=auth_headers_a,
    )
    qr_token_a = tbl_a.json()["qr_token"]

    # Attempt to order Cafe B product through Cafe A table
    res_cross_order = await async_client.post(
        "/api/public/orders",
        json={
            "table_token": qr_token_a,
            "order_type": "DINE_IN",
            "items": [{"product_id": prod_b_id, "quantity": 1}],
        },
        headers={"X-Tenant-Subdomain": "brewhouse"},
    )
    assert res_cross_order.status_code == 400
    assert "do not belong to this cafe" in res_cross_order.json()["detail"].lower()


@pytest.mark.asyncio
async def test_09_table_context_is_preserved(async_client, auth_headers_a):
    """9. Table context is preserved authoritatively from backend."""
    tbl_res = await async_client.post(
        "/api/tables",
        json={"table_number": "VIP-01"},
        headers=auth_headers_a,
    )
    assert tbl_res.status_code == 201
    table_id = tbl_res.json()["table_id"]
    qr_token = tbl_res.json()["qr_token"]

    # Create product
    cat_res = await async_client.post(
        "/api/categories",
        json={"name": "Snacks", "display_order": 3},
        headers=auth_headers_a,
    )
    prod_res = await async_client.post(
        "/api/products",
        json={
            "category_id": cat_res.json()["category_id"],
            "name": "Croissant",
            "price": 120.0,
            "is_available": True,
        },
        headers=auth_headers_a,
    )
    prod_id = prod_res.json()["product_id"]

    # Order sent with table_token only (table_number resolved strictly by backend)
    order_res = await async_client.post(
        "/api/public/orders",
        json={
            "table_token": qr_token,
            "order_type": "DINE_IN",
            "items": [{"product_id": prod_id, "quantity": 1}],
        },
    )
    assert order_res.status_code == 201
    order = order_res.json()
    assert order["table_id"] == table_id
    assert order["table_number"] == "VIP-01"


@pytest.mark.asyncio
async def test_10_qr_url_generation_contains_correct_context(async_client, auth_headers_a):
    """10. QR URL and PNG generation contain correct cafe/table context and support base_url."""
    tbl_res = await async_client.post(
        "/api/tables",
        json={"table_number": "Table 10"},
        headers=auth_headers_a,
    )
    assert tbl_res.status_code == 201
    tbl = tbl_res.json()
    tbl_id = tbl["table_id"]
    qr_token = tbl["qr_token"]

    # Authenticated admin QR PNG generation with custom base URL header
    qr_res = await async_client.get(
        f"/api/tables/{tbl_id}/qr",
        headers={**auth_headers_a, "X-Frontend-Url": "https://cafe-qr-seven.vercel.app"},
    )
    assert qr_res.status_code == 200
    assert qr_res.headers["content-type"] == "image/png"
    assert qr_res.content[:8] == b"\x89PNG\r\n\x1a\n"

    # Public QR PNG generation endpoint
    public_qr_res = await async_client.get(
        f"/api/public/table/{qr_token}/qr",
        headers={"Origin": "https://cafe-qr-seven.vercel.app"},
    )
    assert public_qr_res.status_code == 200
    assert public_qr_res.headers["content-type"] == "image/png"
    assert public_qr_res.content[:8] == b"\x89PNG\r\n\x1a\n"


@pytest.mark.asyncio
async def test_11_multiple_tables_produce_different_secure_qr_destinations(
    async_client, auth_headers_a, auth_headers_b
):
    """11. Multiple tables produce different secure tokens even with same table number across cafes."""
    # Cafe A: Table 01, Table 02
    tbl_a1 = (
        await async_client.post(
            "/api/tables",
            json={"table_number": "Table 01"},
            headers=auth_headers_a,
        )
    ).json()

    tbl_a2 = (
        await async_client.post(
            "/api/tables",
            json={"table_number": "Table 02"},
            headers=auth_headers_a,
        )
    ).json()

    # Cafe B: Table 01, Table 02 (same table numbers in different cafe!)
    tbl_b1 = (
        await async_client.post(
            "/api/tables",
            json={"table_number": "Table 01"},
            headers=auth_headers_b,
        )
    ).json()

    tbl_b2 = (
        await async_client.post(
            "/api/tables",
            json={"table_number": "Table 02"},
            headers=auth_headers_b,
        )
    ).json()

    tokens = [tbl_a1["qr_token"], tbl_a2["qr_token"], tbl_b1["qr_token"], tbl_b2["qr_token"]]

    # Verify all 4 tokens are distinct
    assert len(set(tokens)) == 4

    # Verify Table 01 in Cafe A resolves to Brew House
    res_a1 = await async_client.get(f"/api/public/table/{tbl_a1['qr_token']}")
    assert res_a1.status_code == 200
    assert res_a1.json()["cafe"]["subdomain"] == "brewhouse"
    assert res_a1.json()["table"]["table_number"] == "Table 01"

    # Verify Table 01 in Cafe B resolves to Mocha Cafe
    res_b1 = await async_client.get(f"/api/public/table/{tbl_b1['qr_token']}")
    assert res_b1.status_code == 200
    assert res_b1.json()["cafe"]["subdomain"] == "mochacafe"
    assert res_b1.json()["table"]["table_number"] == "Table 01"
