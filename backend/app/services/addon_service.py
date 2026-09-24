from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from app.repositories.addon_repository import AddonRepository
from app.utils.ids import generate_id


class AddonService:
    def __init__(self, addon_repo: AddonRepository):
        self.addon_repo = addon_repo

    async def list_addon_groups(
        self,
        cafe_id: str,
        product_id: Optional[str] = None,
        limit: int = 200,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        return await self.addon_repo.get_all(
            cafe_id=cafe_id,
            product_id=product_id,
            limit=limit,
            skip=skip
        )

    async def get_addons_for_products(
        self,
        cafe_id: str,
        product_ids: List[str],
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Returns a map of product_id -> list of addon groups applicable to it."""
        all_groups = await self.addon_repo.get_for_products(cafe_id, product_ids)

        result: Dict[str, List[Dict[str, Any]]] = {pid: [] for pid in product_ids}
        for group in all_groups:
            for pid in group.get("product_ids", []):
                if pid in result:
                    result[pid].append(group)

        return result

    async def get_addon_group(self, cafe_id: str, addon_group_id: str) -> Dict[str, Any]:
        group = await self.addon_repo.get_by_id(cafe_id, addon_group_id)
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Add-on group not found."
            )
        return group

    async def create_addon_group(self, cafe_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        addon_group_id = generate_id("addon")

        # Generate IDs for items if not provided
        items = data.get("items", [])
        for item in items:
            if not item.get("addon_item_id"):
                item["addon_item_id"] = generate_id("addi")

        record = {
            "addon_group_id": addon_group_id,
            "cafe_id": cafe_id,
            "name": data["name"].strip(),
            "description": data.get("description"),
            "is_required": data.get("is_required", False),
            "max_selections": data.get("max_selections", 1),
            "min_selections": data.get("min_selections", 0),
            "display_order": data.get("display_order", 0),
            "items": items,
            "product_ids": data.get("product_ids", []),
        }
        return await self.addon_repo.create(record)

    async def update_addon_group(
        self, cafe_id: str, addon_group_id: str, data: Dict[str, Any]
    ) -> Dict[str, Any]:
        clean_update = {k: v for k, v in data.items() if v is not None}

        if "name" in clean_update:
            clean_update["name"] = clean_update["name"].strip()

        # Generate IDs for new items
        if "items" in clean_update:
            for item in clean_update["items"]:
                if not item.get("addon_item_id"):
                    item["addon_item_id"] = generate_id("addi")

        updated = await self.addon_repo.update(cafe_id, addon_group_id, clean_update)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Add-on group not found."
            )
        return updated

    async def delete_addon_group(self, cafe_id: str, addon_group_id: str) -> bool:
        deleted = await self.addon_repo.delete(cafe_id, addon_group_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Add-on group not found."
            )
        return True
