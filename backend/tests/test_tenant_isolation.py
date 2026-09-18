import pytest


@pytest.mark.asyncio
async def test_tenant_isolation_categories(async_client, auth_headers_a, auth_headers_b):
    # Cafe A creates a category
    res_a = await async_client.post(
        "/api/categories",
        json={"name": "Cafe A Coffee", "display_order": 1},
        headers=auth_headers_a,
    )
    assert res_a.status_code == 201
    cat_a_id = res_a.json()["category_id"]

    # Cafe B lists categories -> must NOT see Cafe A's category
    res_b_list = await async_client.get("/api/categories", headers=auth_headers_b)
    assert res_b_list.status_code == 200
    ids_b = [c["category_id"] for c in res_b_list.json()]
    assert cat_a_id not in ids_b

    # Cafe B attempts to get Cafe A's category directly -> 404
    res_b_get = await async_client.get(f"/api/categories/{cat_a_id}", headers=auth_headers_b)
    assert res_b_get.status_code == 404

    # Cafe B attempts to delete Cafe A's category -> 404
    res_b_del = await async_client.delete(f"/api/categories/{cat_a_id}", headers=auth_headers_b)
    assert res_b_del.status_code == 404


@pytest.mark.asyncio
async def test_tenant_isolation_products(async_client, auth_headers_a, auth_headers_b):
    # 1. Cafe A creates category and product
    cat_res = await async_client.post(
        "/api/categories",
        json={"name": "Espresso Bar", "display_order": 1},
        headers=auth_headers_a,
    )
    cat_a_id = cat_res.json()["category_id"]

    prod_res = await async_client.post(
        "/api/products",
        json={
            "category_id": cat_a_id,
            "name": "Single Origin Espresso",
            "price": 140.0,
            "is_available": True,
        },
        headers=auth_headers_a,
    )
    assert prod_res.status_code == 201
    prod_a_id = prod_res.json()["product_id"]

    # 2. Cafe B cannot see Cafe A's product in list
    res_b_list = await async_client.get("/api/products", headers=auth_headers_b)
    assert res_b_list.status_code == 200
    ids_b = [p["product_id"] for p in res_b_list.json()]
    assert prod_a_id not in ids_b

    # 3. Cafe B cannot view Cafe A's product directly -> 404
    res_b_get = await async_client.get(f"/api/products/{prod_a_id}", headers=auth_headers_b)
    assert res_b_get.status_code == 404

    # 4. Cafe B cannot modify Cafe A's product -> 404
    res_b_put = await async_client.put(
        f"/api/products/{prod_a_id}",
        json={"price": 10.0},
        headers=auth_headers_b,
    )
    assert res_b_put.status_code == 404

    # 5. Cafe B cannot delete Cafe A's product -> 404
    res_b_del = await async_client.delete(f"/api/products/{prod_a_id}", headers=auth_headers_b)
    assert res_b_del.status_code == 404


@pytest.mark.asyncio
async def test_tenant_isolation_tables(async_client, auth_headers_a, auth_headers_b):
    # Cafe A creates Table 1
    table_res = await async_client.post(
        "/api/tables",
        json={"table_number": "1"},
        headers=auth_headers_a,
    )
    assert table_res.status_code == 201
    tbl_a_id = table_res.json()["table_id"]

    # Cafe B cannot see Cafe A's table
    res_b_list = await async_client.get("/api/tables", headers=auth_headers_b)
    assert res_b_list.status_code == 200
    ids_b = [t["table_id"] for t in res_b_list.json()]
    assert tbl_a_id not in ids_b

    # Cafe B cannot access Cafe A's table directly -> 404
    res_b_get = await async_client.get(f"/api/tables/{tbl_a_id}", headers=auth_headers_b)
    assert res_b_get.status_code == 404


@pytest.mark.asyncio
async def test_tenant_isolation_settings(async_client, auth_headers_a, auth_headers_b):
    # Cafe A updates their name
    res_a = await async_client.put(
        "/api/cafe",
        json={"name": "Brew House Roastery"},
        headers=auth_headers_a,
    )
    assert res_a.status_code == 200
    assert res_a.json()["name"] == "Brew House Roastery"

    # Cafe B fetches their settings -> remains unchanged
    res_b = await async_client.get("/api/cafe", headers=auth_headers_b)
    assert res_b.status_code == 200
    assert res_b.json()["name"] == "Mocha Cafe"


@pytest.mark.asyncio
async def test_tenant_isolation_orders(async_client, auth_headers_a, auth_headers_b):
    # Cafe A creates a category, product, table and places an order
    cat_res = await async_client.post("/api/categories", json={"name": "A Cat"}, headers=auth_headers_a)
    prod_res = await async_client.post(
        "/api/products",
        json={"category_id": cat_res.json()["category_id"], "name": "Latte", "price": 100.0},
        headers=auth_headers_a,
    )
    tbl_res = await async_client.post("/api/tables", json={"table_number": "T1"}, headers=auth_headers_a)
    order_res = await async_client.post(
        "/api/public/orders",
        json={
            "table_token": tbl_res.json()["qr_token"],
            "order_type": "DINE_IN",
            "items": [{"product_id": prod_res.json()["product_id"], "quantity": 1}],
        },
        headers={"X-Tenant-Subdomain": "brewhouse"},
    )
    assert order_res.status_code == 201
    order_a_id = order_res.json()["order_id"]

    # Cafe B admin lists orders -> Cafe A's order must NOT be visible
    orders_b_res = await async_client.get("/api/orders", headers=auth_headers_b)
    assert orders_b_res.status_code == 200
    ids_b = [o["order_id"] for o in orders_b_res.json()]
    assert order_a_id not in ids_b

    # Cafe B admin tries to view Cafe A's order directly -> 404
    get_b_res = await async_client.get(f"/api/orders/{order_a_id}", headers=auth_headers_b)
    assert get_b_res.status_code == 404

    # Cafe B admin tries to change status of Cafe A's order -> 404
    patch_b_res = await async_client.patch(
        f"/api/orders/{order_a_id}/status",
        json={"status": "ACCEPTED"},
        headers=auth_headers_b,
    )
    assert patch_b_res.status_code == 404

