import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.ably_service import AblyService


@pytest.mark.asyncio
async def test_ably_new_order_and_status_publishing(async_client, auth_headers_a):
    # Setup Category, Product, Table for Cafe A
    cat_res = await async_client.post("/api/categories", json={"name": "Beverages"}, headers=auth_headers_a)
    prod_res = await async_client.post(
        "/api/products",
        json={"category_id": cat_res.json()["category_id"], "name": "Espresso", "price": 120.0},
        headers=auth_headers_a,
    )
    tbl_res = await async_client.post("/api/tables", json={"table_number": "T-10"}, headers=auth_headers_a)

    prod_id = prod_res.json()["product_id"]
    qr_token = tbl_res.json()["qr_token"]

    with patch("app.services.order_service.ably_service.publish_new_order", new_callable=AsyncMock) as mock_pub_new, \
         patch("app.services.order_service.ably_service.publish_order_status_update", new_callable=AsyncMock) as mock_pub_status:

        mock_pub_new.return_value = True
        mock_pub_status.return_value = True

        # 1. Customer places an order
        order_res = await async_client.post(
            "/api/public/orders",
            json={
                "table_token": qr_token,
                "order_type": "DINE_IN",
                "customer_name": "Aslam",
                "items": [{"product_id": prod_id, "quantity": 1}],
            },
            headers={"X-Tenant-Subdomain": "brewhouse"},
        )
        assert order_res.status_code == 201
        order_data = order_res.json()
        order_id = order_data["order_id"]

        # Verify publish_new_order was called with the persisted order record
        mock_pub_new.assert_called_once()
        published_order = mock_pub_new.call_args[0][0]
        assert published_order["order_id"] == order_id
        assert published_order["cafe_id"] == "cafe_001"
        assert published_order["order_status"] == "PLACED"

        # 2. Cafe admin updates status: PLACED -> ACCEPTED
        status_res = await async_client.patch(
            f"/api/orders/{order_id}/status",
            json={"status": "ACCEPTED"},
            headers=auth_headers_a,
        )
        assert status_res.status_code == 200

        # Verify publish_order_status_update was called
        mock_pub_status.assert_called_once()
        status_call_args = mock_pub_status.call_args[0]
        assert status_call_args[0]["order_id"] == order_id
        assert status_call_args[1] == "ACCEPTED"


@pytest.mark.asyncio
async def test_order_persists_even_if_ably_fails(async_client, auth_headers_a):
    # Setup Product and Table
    cat_res = await async_client.post("/api/categories", json={"name": "Snacks"}, headers=auth_headers_a)
    prod_res = await async_client.post(
        "/api/products",
        json={"category_id": cat_res.json()["category_id"], "name": "Croissant", "price": 150.0},
        headers=auth_headers_a,
    )
    tbl_res = await async_client.post("/api/tables", json={"table_number": "T-11"}, headers=auth_headers_a)

    prod_id = prod_res.json()["product_id"]
    qr_token = tbl_res.json()["qr_token"]

    # Simulate Ably network outage raising an exception
    with patch("app.services.order_service.ably_service.publish_new_order", new_callable=AsyncMock) as mock_pub_new:
        mock_pub_new.side_effect = Exception("Ably cluster unreachable: connection timeout")

        order_res = await async_client.post(
            "/api/public/orders",
            json={
                "table_token": qr_token,
                "order_type": "DINE_IN",
                "customer_name": "Safe Order Test",
                "items": [{"product_id": prod_id, "quantity": 2}],
            },
            headers={"X-Tenant-Subdomain": "brewhouse"},
        )
        # The order MUST succeed (201 Created) because DB persistence is authoritative!
        assert order_res.status_code == 201
        order_data = order_res.json()
        assert order_data["total"] == 315.0  # 300 + 5% tax
        assert order_data["order_status"] == "PLACED"


@pytest.mark.asyncio
async def test_realtime_token_endpoints(async_client, auth_headers_a):
    # Admin realtime token
    admin_token_res = await async_client.get("/api/realtime/token", headers=auth_headers_a)
    assert admin_token_res.status_code == 200

    # Customer realtime token for invalid order -> 404
    cust_res = await async_client.get("/api/realtime/customer-token/non_existent_ref")
    assert cust_res.status_code == 404
