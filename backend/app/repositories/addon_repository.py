from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING


class AddonRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.addon_groups

    async def get_all(
        self,
        cafe_id: str,
        product_id: Optional[str] = None,
        limit: int = 200,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {"cafe_id": cafe_id}
        if product_id:
            query["product_ids"] = product_id  # matches if product_id is in the array

        cursor = (
            self.collection.find(query, {"_id": 0})
            .sort("display_order", ASCENDING)
            .skip(skip)
            .limit(limit)
        )
        return await cursor.to_list(length=limit)

    async def get_for_products(
        self,
        cafe_id: str,
        product_ids: List[str],
    ) -> List[Dict[str, Any]]:
        """Get all addon groups that apply to any of the given product_ids."""
        if not product_ids:
            return []
        cursor = self.collection.find(
            {
                "cafe_id": cafe_id,
                "$or": [
                    {"product_ids": {"$in": product_ids}},
                    {"product_ids": []},
                ],
            },
            {"_id": 0}
        ).sort("display_order", ASCENDING)
        return await cursor.to_list(length=200)

    async def get_by_id(self, cafe_id: str, addon_group_id: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one(
            {"cafe_id": cafe_id, "addon_group_id": addon_group_id},
            {"_id": 0}
        )

    async def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        data["created_at"] = now
        data["updated_at"] = now
        await self.collection.insert_one(data)
        data.pop("_id", None)
        return data

    async def update(
        self, cafe_id: str, addon_group_id: str, update_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        update_data["updated_at"] = datetime.now(timezone.utc)
        result = await self.collection.find_one_and_update(
            {"cafe_id": cafe_id, "addon_group_id": addon_group_id},
            {"$set": update_data},
            return_document=True,
            projection={"_id": 0}
        )
        return result

    async def delete(self, cafe_id: str, addon_group_id: str) -> bool:
        result = await self.collection.delete_one(
            {"cafe_id": cafe_id, "addon_group_id": addon_group_id}
        )
        return result.deleted_count > 0
