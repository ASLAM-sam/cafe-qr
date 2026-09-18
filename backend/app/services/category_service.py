from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from app.repositories.category_repository import CategoryRepository
from app.repositories.product_repository import ProductRepository
from app.utils.ids import generate_id


class CategoryService:
    def __init__(self, category_repo: CategoryRepository, product_repo: ProductRepository):
        self.category_repo = category_repo
        self.product_repo = product_repo

    async def list_categories(self, cafe_id: str, active_only: bool = False) -> List[Dict[str, Any]]:
        return await self.category_repo.get_all(cafe_id, active_only=active_only)

    async def get_category(self, cafe_id: str, category_id: str) -> Dict[str, Any]:
        category = await self.category_repo.get_by_id(cafe_id, category_id)
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")
        return category

    async def create_category(self, cafe_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        category_id = generate_id("cat")
        record = {
            "category_id": category_id,
            "cafe_id": cafe_id,
            "name": data["name"].strip(),
            "description": data.get("description"),
            "image": data.get("image"),
            "display_order": data.get("display_order", 0),
            "is_active": data.get("is_active", True),
        }
        return await self.category_repo.create(record)

    async def update_category(
        self, cafe_id: str, category_id: str, data: Dict[str, Any]
    ) -> Dict[str, Any]:
        clean_update = {k: v for k, v in data.items() if v is not None}
        if "name" in clean_update:
            clean_update["name"] = clean_update["name"].strip()
        updated = await self.category_repo.update(cafe_id, category_id, clean_update)
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")
        return updated

    async def delete_category(self, cafe_id: str, category_id: str) -> bool:
        # Check if category exists
        await self.get_category(cafe_id, category_id)

        # Check if any products are assigned to this category
        products_in_cat = await self.product_repo.get_all(cafe_id, category_id=category_id, limit=1)
        if len(products_in_cat) > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete category: products are assigned to it. Please reassign or delete the products first.",
            )

        deleted = await self.category_repo.delete(cafe_id, category_id)
        return deleted
