import io
import pytest
from unittest.mock import AsyncMock, patch
from fastapi import HTTPException
from app.services.cloudinary_service import CloudinaryService, ALLOWED_MIME_TYPES


def test_cloudinary_validation():
    service = CloudinaryService()

    # Valid PNG
    service.validate_image_file("image/png", 1024, "coffee.png")

    # Valid JPEG
    service.validate_image_file("image/jpeg", 2048, "latte.jpg")

    # Valid WEBP
    service.validate_image_file("image/webp", 4096, "dessert.webp")

    # Invalid MIME type
    with pytest.raises(HTTPException) as exc_info:
        service.validate_image_file("application/pdf", 1024, "menu.pdf")
    assert exc_info.value.status_code == 400
    assert "Unsupported image type" in exc_info.value.detail

    # Mismatched extension
    with pytest.raises(HTTPException) as exc_info:
        service.validate_image_file("image/png", 1024, "coffee.jpg")
    assert exc_info.value.status_code == 400
    assert "does not match content type" in exc_info.value.detail

    # File too large (> 5MB)
    with pytest.raises(HTTPException) as exc_info:
        service.validate_image_file("image/png", 6 * 1024 * 1024, "huge.png")
    assert exc_info.value.status_code == 400
    assert "exceeds maximum limit" in exc_info.value.detail


@pytest.mark.asyncio
async def test_product_image_upload_and_replacement(async_client, auth_headers_a, auth_headers_b):
    # 1. Cafe A creates a category and a product
    cat_res = await async_client.post(
        "/api/categories",
        json={"name": "Specialty Coffee"},
        headers=auth_headers_a,
    )
    cat_id = cat_res.json()["category_id"]

    prod_res = await async_client.post(
        "/api/products",
        json={"category_id": cat_id, "name": "Cold Brew", "price": 180.0},
        headers=auth_headers_a,
    )
    prod_id = prod_res.json()["product_id"]

    # 2. Mock Cloudinary upload and delete methods
    fake_upload_1 = {
        "image_url": "https://res.cloudinary.com/demo/image/upload/v1/cafe_qr/cafes/cafe_001/products/cold_brew_1.jpg",
        "image_public_id": "cafe_qr/cafes/cafe_001/products/cold_brew_1",
    }
    fake_upload_2 = {
        "image_url": "https://res.cloudinary.com/demo/image/upload/v2/cafe_qr/cafes/cafe_001/products/cold_brew_2.jpg",
        "image_public_id": "cafe_qr/cafes/cafe_001/products/cold_brew_2",
    }

    with patch("app.services.product_service.cloudinary_service.upload_image", new_callable=AsyncMock) as mock_upload, \
         patch("app.services.product_service.cloudinary_service.delete_image", new_callable=AsyncMock) as mock_delete:

        mock_upload.return_value = fake_upload_1
        mock_delete.return_value = True

        # Upload first image
        fake_file_1 = io.BytesIO(b"fake image data 1")
        upload_res_1 = await async_client.post(
            f"/api/products/{prod_id}/image",
            files={"file": ("cold_brew_1.jpg", fake_file_1, "image/jpeg")},
            headers=auth_headers_a,
        )
        assert upload_res_1.status_code == 200
        data_1 = upload_res_1.json()
        assert data_1["image_url"] == fake_upload_1["image_url"]
        assert data_1["image_public_id"] == fake_upload_1["image_public_id"]
        mock_delete.assert_not_called()

        # 3. Replace image -> old image must be deleted after new upload succeeds
        mock_upload.return_value = fake_upload_2
        fake_file_2 = io.BytesIO(b"fake image data 2")
        upload_res_2 = await async_client.post(
            f"/api/products/{prod_id}/image",
            files={"file": ("cold_brew_2.jpg", fake_file_2, "image/jpeg")},
            headers=auth_headers_a,
        )
        assert upload_res_2.status_code == 200
        data_2 = upload_res_2.json()
        assert data_2["image_url"] == fake_upload_2["image_url"]
        assert data_2["image_public_id"] == fake_upload_2["image_public_id"]
        # Old image must have been deleted
        mock_delete.assert_called_once_with(fake_upload_1["image_public_id"], "cafe_001")


@pytest.mark.asyncio
async def test_product_image_tenant_isolation(async_client, auth_headers_a, auth_headers_b):
    # Cafe A creates a product
    cat_res = await async_client.post("/api/categories", json={"name": "Tea"}, headers=auth_headers_a)
    prod_res = await async_client.post(
        "/api/products",
        json={"category_id": cat_res.json()["category_id"], "name": "Green Tea", "price": 90.0},
        headers=auth_headers_a,
    )
    prod_id = prod_res.json()["product_id"]

    # Cafe B attempts to upload an image for Cafe A's product -> must return 404
    fake_file = io.BytesIO(b"fake green tea image")
    attack_res = await async_client.post(
        f"/api/products/{prod_id}/image",
        files={"file": ("green_tea.jpg", fake_file, "image/jpeg")},
        headers=auth_headers_b,
    )
    assert attack_res.status_code == 404
