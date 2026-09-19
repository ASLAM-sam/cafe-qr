from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from app.repositories.product_repository import ProductRepository
from app.repositories.category_repository import CategoryRepository
from app.services.cloudinary_service import CloudinaryService, cloudinary_service
from app.utils.ids import generate_id


class ProductService:
    def __init__(
        self,
        product_repo: ProductRepository,
        category_repo: CategoryRepository,
        cloud_service: CloudinaryService = cloudinary_service,
    ):
        self.product_repo = product_repo
        self.category_repo = category_repo
        self.cloudinary_service = cloud_service

    async def list_products(
        self,
        cafe_id: str,
        category_id: Optional[str] = None,
        available_only: bool = False,
        limit: int = 100,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        return await self.product_repo.get_all(
            cafe_id=cafe_id,
            category_id=category_id,
            available_only=available_only,
            limit=limit,
            skip=skip
        )

    async def get_product(self, cafe_id: str, product_id: str) -> Dict[str, Any]:
        product = await self.product_repo.get_by_id(cafe_id, product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
        return product

    async def create_product(self, cafe_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        # Verify category exists in this café
        category = await self.category_repo.get_by_id(cafe_id, data["category_id"])
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid category: the specified category does not exist in this café.",
            )

        product_id = generate_id("prod")
        record = {
            "product_id": product_id,
            "cafe_id": cafe_id,
            "category_id": data["category_id"],
            "name": data["name"].strip(),
            "description": data.get("description"),
            "price": float(data["price"]),
            "image_url": data.get("image_url"),
            "image_public_id": data.get("image_public_id"),
            "is_available": data.get("is_available", True),
            "display_order": data.get("display_order", 0),
        }
        return await self.product_repo.create(record)

    async def update_product(
        self, cafe_id: str, product_id: str, data: Dict[str, Any]
    ) -> Dict[str, Any]:
        # If updating category, verify it belongs to this café
        if data.get("category_id"):
            category = await self.category_repo.get_by_id(cafe_id, data["category_id"])
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid category: the specified category does not exist in this café.",
                )

        clean_update = {k: v for k, v in data.items() if v is not None}
        if "name" in clean_update:
            clean_update["name"] = clean_update["name"].strip()
        if "price" in clean_update:
            clean_update["price"] = float(clean_update["price"])

        updated = await self.product_repo.update(cafe_id, product_id, clean_update)
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
        return updated

    async def update_product_image(
        self,
        cafe_id: str,
        product_id: str,
        file_bytes: bytes,
        content_type: str,
        filename: str,
    ) -> Dict[str, Any]:
        """
        Upload new product image to Cloudinary, update MongoDB, and safely clean up old image.
        """
        product = await self.get_product(cafe_id, product_id)
        old_public_id = product.get("image_public_id")

        # 1. Upload new image to Cloudinary
        upload_result = await self.cloudinary_service.upload_image(
            file_bytes=file_bytes,
            cafe_id=cafe_id,
            content_type=content_type,
            filename=filename,
            folder="products",
        )

        # 2. Update product in MongoDB
        updated = await self.product_repo.update(
            cafe_id,
            product_id,
            {
                "image_url": upload_result["image_url"],
                "image_public_id": upload_result["image_public_id"],
            },
        )
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

        # 3. Only delete old image AFTER database update succeeds
        if old_public_id and old_public_id != upload_result["image_public_id"]:
            await self.cloudinary_service.delete_image(old_public_id, cafe_id)

        return updated

    async def delete_product(self, cafe_id: str, product_id: str) -> bool:
        product = await self.get_product(cafe_id, product_id)
        image_public_id = product.get("image_public_id")

        deleted = await self.product_repo.delete(cafe_id, product_id)
        if deleted and image_public_id:
            # Clean up Cloudinary asset
            await self.cloudinary_service.delete_image(image_public_id, cafe_id)

        return deleted
