import pytest
from app.core.config import settings


@pytest.mark.asyncio
async def test_sec_01_cafe_a_cannot_read_cafe_b_product(async_client, auth_headers_a, auth_headers_b):
    """1. Cafe A cannot read Cafe B product."""
    # Cafe B creates a category and product
    cat_res = await async_client.post("/api/categories", json={"name": "B Specials"}, headers=auth_headers_b)
    cat_b_id = cat_res.json()["category_id"]

    prod_res = await async_client.post(
        "/api/products",
        json={"category_id": cat_b_id, "name": "B Secret Blend", "price": 200.0},
        headers=auth_headers_b,
    )
    prod_b_id = prod_res.json()["product_id"]

    # Cafe A attempts to read Cafe B's product directly -> 404 Not Found
    res = await async_client.get(f"/api/products/{prod_b_id}", headers=auth_headers_a)
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_sec_02_cafe_a_cannot_update_cafe_b_product(async_client, auth_headers_a, auth_headers_b):
    """2. Cafe A cannot update Cafe B product."""
    cat_res = await async_client.post("/api/categories", json={"name": "B Cat"}, headers=auth_headers_b)
    prod_res = await async_client.post(
        "/api/products",
        json={"category_id": cat_res.json()["category_id"], "name": "B Tea", "price": 80.0},
        headers=auth_headers_b,
    )
    prod_b_id = prod_res.json()["product_id"]

    # Cafe A attempts to modify price of Cafe B's product -> 404 Not Found
    res = await async_client.put(
        f"/api/products/{prod_b_id}",
        json={"price": 1.0},
        headers=auth_headers_a,
    )
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_sec_03_cafe_a_cannot_delete_cafe_b_product(async_client, auth_headers_a, auth_headers_b):
    """3. Cafe A cannot delete Cafe B product."""
    cat_res = await async_client.post("/api/categories", json={"name": "B Del Cat"}, headers=auth_headers_b)
    prod_res = await async_client.post(
        "/api/products",
        json={"category_id": cat_res.json()["category_id"], "name": "B Item", "price": 50.0},
        headers=auth_headers_b,
    )
    prod_b_id = prod_res.json()["product_id"]

    # Cafe A attempts to delete Cafe B's product -> 404 Not Found
    res = await async_client.delete(f"/api/products/{prod_b_id}", headers=auth_headers_a)
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_sec_04_cafe_a_cannot_read_cafe_b_orders(async_client, auth_headers_a, auth_headers_b):
    """4. Cafe A cannot read Cafe B orders."""
    cat_res = await async_client.post("/api/categories", json={"name": "B Drinks"}, headers=auth_headers_b)
    prod_res = await async_client.post(
        "/api/products",
        json={"category_id": cat_res.json()["category_id"], "name": "B Mocha", "price": 150.0},
        headers=auth_headers_b,
    )
    tbl_res = await async_client.post("/api/tables", json={"table_number": "B-1"}, headers=auth_headers_b)

    order_res = await async_client.post(
        "/api/public/orders",
        json={
            "table_token": tbl_res.json()["qr_token"],
            "order_type": "DINE_IN",
            "items": [{"product_id": prod_res.json()["product_id"], "quantity": 1}],
        },
        headers={"X-Tenant-Subdomain": "mochacafe"},
    )
    assert order_res.status_code == 201
    order_b_id = order_res.json()["order_id"]

    # Cafe A tries to fetch Cafe B's order by ID -> 404 Not Found
    res = await async_client.get(f"/api/orders/{order_b_id}", headers=auth_headers_a)
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_sec_05_cafe_a_cannot_manipulate_cafe_b_table(async_client, auth_headers_a, auth_headers_b):
    """5. Cafe A cannot manipulate Cafe B table."""
    tbl_res = await async_client.post("/api/tables", json={"table_number": "VIP-B"}, headers=auth_headers_b)
    tbl_b_id = tbl_res.json()["table_id"]

    # Cafe A attempts to view, update, or delete Cafe B's table -> 404 Not Found
    get_res = await async_client.get(f"/api/tables/{tbl_b_id}", headers=auth_headers_a)
    assert get_res.status_code == 404

    put_res = await async_client.put(
        f"/api/tables/{tbl_b_id}",
        json={"table_number": "Hacked"},
        headers=auth_headers_a,
    )
    assert put_res.status_code == 404

    del_res = await async_client.delete(f"/api/tables/{tbl_b_id}", headers=auth_headers_a)
    assert del_res.status_code == 404


@pytest.mark.asyncio
async def test_sec_06_customer_cannot_read_arbitrary_order(async_client):
    """6. Customer cannot read arbitrary orders via guessable IDs."""
    # Sequential IDs or non-existent tokens must return 404
    res_1 = await async_client.get("/api/public/orders/1")
    assert res_1.status_code == 404

    res_2 = await async_client.get("/api/public/orders/order_12345")
    assert res_2.status_code == 404

    res_3 = await async_client.get("/api/public/orders/non-existent-order-ref")
    assert res_3.status_code == 404


@pytest.mark.asyncio
async def test_sec_07_invalid_qr_token_rejected(async_client):
    """7. Invalid or non-existent QR tokens are safely rejected with 404."""
    res_invalid = await async_client.get("/api/public/table/invalid_qr_token_12345")
    assert res_invalid.status_code == 404
    assert "invalid" in res_invalid.json()["detail"].lower() or "not found" in res_invalid.json()["detail"].lower()


@pytest.mark.asyncio
async def test_sec_08_invalid_jwt_rejected(async_client):
    """8. Invalid, expired, or malformed JWT is rejected with 401 Unauthorized."""
    # No auth
    res_no_auth = await async_client.get("/api/orders")
    assert res_no_auth.status_code == 401

    # Malformed token
    res_bad_token = await async_client.get(
        "/api/orders",
        headers={"Authorization": "Bearer not.a.valid.jwt.token"},
    )
    assert res_bad_token.status_code == 401

    # Random string
    res_garbage = await async_client.get(
        "/api/orders",
        headers={"Authorization": "Bearer garbage_token"},
    )
    assert res_garbage.status_code == 401


@pytest.mark.asyncio
async def test_sec_09_platform_admin_and_cafe_admin_separation(async_client, auth_headers_a):
    """9. Platform admin endpoints reject café owner credentials."""
    # Cafe owner attempts to access platform endpoint -> 403 Forbidden
    res_list = await async_client.get("/api/platform/cafes", headers=auth_headers_a)
    assert res_list.status_code == 403
    assert "platform administrator" in res_list.json()["detail"].lower()

    res_create = await async_client.post(
        "/api/platform/cafes",
        json={
            "name": "Attacker Cafe",
            "subdomain": "attacker",
            "owner_name": "Attacker",
            "owner_email": "attacker@cafe.com",
            "owner_password": "password123",
        },
        headers=auth_headers_a,
    )
    assert res_create.status_code == 403


@pytest.mark.asyncio
async def test_sec_10_frontend_cannot_obtain_private_service_secrets(async_client, auth_headers_a):
    """10. Frontend and public endpoints never expose private credentials."""
    # Public cafe endpoint
    pub_res = await async_client.get("/api/public/cafe", headers={"X-Tenant-Subdomain": "brewhouse"})
    assert pub_res.status_code == 200
    pub_data = str(pub_res.json())
    assert settings.JWT_SECRET not in pub_data
    assert "password" not in pub_data

    # Admin cafe endpoint
    admin_res = await async_client.get("/api/cafe", headers=auth_headers_a)
    assert admin_res.status_code == 200
    admin_data = str(admin_res.json())
    assert settings.JWT_SECRET not in admin_data
    assert "password_hash" not in admin_data

    # Realtime token endpoint
    rt_res = await async_client.get("/api/realtime/token", headers=auth_headers_a)
    assert rt_res.status_code == 200
    rt_data = str(rt_res.json())
    assert settings.JWT_SECRET not in rt_data
    if settings.ABLY_API_KEY:
        # Root key has format appId.keyId:keySecret; the secret part must never be in client response
        if ":" in settings.ABLY_API_KEY:
            secret_part = settings.ABLY_API_KEY.split(":")[1]
            assert secret_part not in rt_data
