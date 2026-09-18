from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from app.repositories.product_repository import ProductRepository
from app.repositories.category_repository import CategoryRepository
from app.utils.ids import generate_id


class ProductService:
    def __init__(self, product_repo: ProductRepository, category_repo: CategoryRepository):
        self.product_repo = product_repo
        self.category_repo = category_repo

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

    async def delete_product(self, cafe_id: str, product_id: str) -> bool:
        await self.get_product(cafe_id, product_id)
        return await self.product_repo.delete(cafe_id, product_id)
