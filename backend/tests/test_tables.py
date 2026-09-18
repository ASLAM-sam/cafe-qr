import pytest


@pytest.mark.asyncio
async def test_table_lifecycle_and_qr(async_client, auth_headers_a):
    # 1. Create Table
    create_res = await async_client.post(
        "/api/tables",
        json={"table_number": "7"},
        headers=auth_headers_a,
    )
    assert create_res.status_code == 201
    table = create_res.json()
    assert table["table_number"] == "7"
    assert "qr_token" in table
    assert len(table["qr_token"]) > 10
    tbl_id = table["table_id"]
    qr_token = table["qr_token"]

    # 2. Duplicate Table Number in same cafe -> 409 Conflict
    dup_res = await async_client.post(
        "/api/tables",
        json={"table_number": "7"},
        headers=auth_headers_a,
    )
    assert dup_res.status_code == 409

    # 3. Public Table QR Resolver
    resolve_res = await async_client.get(f"/api/public/table/{qr_token}")
    assert resolve_res.status_code == 200
    resolve_data = resolve_res.json()
    assert resolve_data["table"]["table_number"] == "7"
    assert resolve_data["cafe"]["name"] == "Brew House"

    # 4. Generate QR Image
    qr_img_res = await async_client.get(f"/api/tables/{tbl_id}/qr", headers=auth_headers_a)
    assert qr_img_res.status_code == 200
    assert qr_img_res.headers["content-type"] == "image/png"
    assert len(qr_img_res.content) > 100

    # 5. Delete Table
    del_res = await async_client.delete(f"/api/tables/{tbl_id}", headers=auth_headers_a)
    assert del_res.status_code == 200
