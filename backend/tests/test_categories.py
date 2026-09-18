import pytest


@pytest.mark.asyncio
async def test_category_lifecycle(async_client, auth_headers_a):
    # 1. Create Category
    create_res = await async_client.post(
        "/api/categories",
        json={"name": "Desserts", "description": "Sweet treats", "display_order": 2},
        headers=auth_headers_a,
    )
    assert create_res.status_code == 201
    cat = create_res.json()
    assert cat["name"] == "Desserts"
    cat_id = cat["category_id"]

    # 2. Update Category
    update_res = await async_client.put(
        f"/api/categories/{cat_id}",
        json={"name": "Artisanal Desserts"},
        headers=auth_headers_a,
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Artisanal Desserts"

    # 3. Delete Category (empty)
    del_res = await async_client.delete(f"/api/categories/{cat_id}", headers=auth_headers_a)
    assert del_res.status_code == 200

    # 4. Verify deleted
    get_res = await async_client.get(f"/api/categories/{cat_id}", headers=auth_headers_a)
    assert get_res.status_code == 404


@pytest.mark.asyncio
async def test_category_orphan_protection(async_client, auth_headers_a):
    # Create category and assign a product
    cat_res = await async_client.post(
        "/api/categories",
        json={"name": "Burgers"},
        headers=auth_headers_a,
    )
    cat_id = cat_res.json()["category_id"]

    prod_res = await async_client.post(
        "/api/products",
        json={"category_id": cat_id, "name": "Classic Burger", "price": 250.0},
        headers=auth_headers_a,
    )
    assert prod_res.status_code == 201

    # Attempting to delete category must fail because a product is assigned
    del_res = await async_client.delete(f"/api/categories/{cat_id}", headers=auth_headers_a)
    assert del_res.status_code == 400
    assert "products are assigned to it" in del_res.json()["detail"]
