import pytest


@pytest.mark.asyncio
async def test_addon_management_and_order_calculation(async_client, auth_headers_a, auth_headers_b):
    # 1. Setup Category and Product for Cafe A
    cat_res = await async_client.post(
        "/api/categories",
        json={"name": "Coffee"},
        headers=auth_headers_a,
    )
    cat_id = cat_res.json()["category_id"]

    prod_res = await async_client.post(
        "/api/products",
        json={"category_id": cat_id, "name": "Latte", "price": 100.0, "is_available": True},
        headers=auth_headers_a,
    )
    prod_id = prod_res.json()["product_id"]

    # 2. Cafe A creates an Add-on Group (Milk Choice)
    addon_payload = {
        "name": "Milk Choice",
        "description": "Select milk type",
        "is_required": True,
        "min_selections": 1,
        "max_selections": 1,
        "items": [
            {"name": "Whole Milk", "price": 0.0, "is_available": True},
            {"name": "Oat Milk", "price": 40.0, "is_available": True},
            {"name": "Almond Milk", "price": 50.0, "is_available": False},
        ],
        "product_ids": [prod_id],
    }

    create_res = await async_client.post(
        "/api/addons",
        json=addon_payload,
        headers=auth_headers_a,
    )
    assert create_res.status_code == 201
    group_data = create_res.json()
    group_id = group_data["addon_group_id"]
    assert group_data["name"] == "Milk Choice"
    assert len(group_data["items"]) == 3
    oat_milk_item = next(it for it in group_data["items"] if it["name"] == "Oat Milk")
    oat_milk_id = oat_milk_item["addon_item_id"]

    # 3. Public customer endpoint fetches addons (subdomain: brewhouse)
    public_res = await async_client.get(
        f"/api/public/addons?product_id={prod_id}",
        headers={"X-Tenant-Subdomain": "brewhouse"},
    )
    assert public_res.status_code == 200
    public_groups = public_res.json()
    assert len(public_groups) >= 1
    target_group = next(g for g in public_groups if g["addon_group_id"] == group_id)
    # Available items only: Almond Milk should be excluded because is_available=False
    assert len(target_group["items"]) == 2
    assert all(it["is_available"] for it in target_group["items"])

    # 4. Setup Table for Cafe A
    tbl_res = await async_client.post(
        "/api/tables",
        json={"table_number": "12"},
        headers=auth_headers_a,
    )
    table_token = tbl_res.json()["qr_token"]

    # 5. Customer places order for 2 Lattes with Oat Milk (+40 each)
    # Base = 100 * 2 = 200
    # Addons = 40 * 2 = 80
    # Subtotal = 280
    # Tax (5%) = 14
    # Total = 294
    order_payload = {
        "table_token": table_token,
        "order_type": "DINE_IN",
        "customer_name": "Aman",
        "customer_phone": "9876543210",
        "items": [
            {
                "product_id": prod_id,
                "quantity": 2,
                "addons": [
                    {
                        "addon_group_id": group_id,
                        "addon_group_name": "Milk Choice",
                        "addon_item_id": oat_milk_id,
                        "addon_item_name": "Oat Milk",
                        "price": 40.0,
                    }
                ],
            }
        ],
    }

    order_res = await async_client.post(
        "/api/public/orders",
        json=order_payload,
        headers={"X-Tenant-Subdomain": "brewhouse"},
    )
    assert order_res.status_code == 201
    order_data = order_res.json()
    assert order_data["subtotal"] == 280.0
    assert order_data["tax"] == 14.0
    assert order_data["total"] == 294.0

    ordered_item = order_data["items"][0]
    assert len(ordered_item["addons"]) == 1
    assert ordered_item["addons"][0]["addon_item_name"] == "Oat Milk"
    assert ordered_item["addons_total"] == 80.0

    # 6. Cafe B isolation test: Cafe B cannot fetch or update Cafe A's addon group
    b_get_res = await async_client.get(
        f"/api/addons/{group_id}",
        headers=auth_headers_b,
    )
    assert b_get_res.status_code == 404

    b_del_res = await async_client.delete(
        f"/api/addons/{group_id}",
        headers=auth_headers_b,
    )
    assert b_del_res.status_code == 404

    # 7. Cafe A updates the addon group
    update_res = await async_client.put(
        f"/api/addons/{group_id}",
        json={"name": "Special Milk Choice", "is_required": False},
        headers=auth_headers_a,
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Special Milk Choice"
    assert update_res.json()["is_required"] is False

    # 8. Cafe A deletes the addon group
    del_res = await async_client.delete(
        f"/api/addons/{group_id}",
        headers=auth_headers_a,
    )
    assert del_res.status_code == 200

    # Verify deleted
    get_after_del = await async_client.get(
        f"/api/addons/{group_id}",
        headers=auth_headers_a,
    )
    assert get_after_del.status_code == 404
