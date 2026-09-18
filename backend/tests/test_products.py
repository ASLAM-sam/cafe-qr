import pytest


@pytest.mark.asyncio
async def test_product_lifecycle(async_client, auth_headers_a):
    # 1. Create Category
    cat_res = await async_client.post(
        "/api/categories",
        json={"name": "Cold Brews"},
        headers=auth_headers_a,
    )
    cat_id = cat_res.json()["category_id"]

    # 2. Create Product
    prod_res = await async_client.post(
        "/api/products",
        json={
            "category_id": cat_id,
            "name": "Nitro Cold Brew",
            "description": "Velvety smooth nitrogen cold brew",
            "price": 220.0,
            "is_available": True,
        },
        headers=auth_headers_a,
    )
    assert prod_res.status_code == 201
    prod = prod_res.json()
    assert prod["name"] == "Nitro Cold Brew"
    assert prod["price"] == 220.0
    prod_id = prod["product_id"]

    # 3. Update Product Availability
    update_res = await async_client.put(
        f"/api/products/{prod_id}",
        json={"is_available": False, "price": 230.0},
        headers=auth_headers_a,
    )
    assert update_res.status_code == 200
    assert update_res.json()["is_available"] is False
    assert update_res.json()["price"] == 230.0

    # 4. Check public endpoint hides unavailable product from active customer menu
    public_res = await async_client.get(
        "/api/public/products",
        headers={"X-Tenant-Subdomain": "brewhouse"}
    )
    assert public_res.status_code == 200
    public_ids = [p["product_id"] for p in public_res.json()]
    assert prod_id not in public_ids


@pytest.mark.asyncio
async def test_product_invalid_category(async_client, auth_headers_a):
    response = await async_client.post(
        "/api/products",
        json={
            "category_id": "nonexistent_cat",
            "name": "Latte",
            "price": 160.0,
        },
        headers=auth_headers_a,
    )
    assert response.status_code == 400
    assert "Invalid category" in response.json()["detail"]
