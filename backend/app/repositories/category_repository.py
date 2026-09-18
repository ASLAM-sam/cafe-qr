from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING


class CategoryRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.categories

    async def get_all(self, cafe_id: str, active_only: bool = False) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {"cafe_id": cafe_id}
        if active_only:
            query["is_active"] = True
        cursor = self.collection.find(query, {"_id": 0}).sort("display_order", ASCENDING)
        return await cursor.to_list(length=200)

    async def get_by_id(self, cafe_id: str, category_id: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one(
            {"cafe_id": cafe_id, "category_id": category_id},
            {"_id": 0}
        )

    async def create(self, category_data: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        category_data["created_at"] = now
        category_data["updated_at"] = now
        await self.collection.insert_one(category_data)
        category_data.pop("_id", None)
        return category_data

    async def update(
        self, cafe_id: str, category_id: str, update_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        update_data["updated_at"] = datetime.now(timezone.utc)
        result = await self.collection.find_one_and_update(
            {"cafe_id": cafe_id, "category_id": category_id},
            {"$set": update_data},
            return_document=True,
            projection={"_id": 0}
        )
        return result

    async def delete(self, cafe_id: str, category_id: str) -> bool:
        result = await self.collection.delete_one(
            {"cafe_id": cafe_id, "category_id": category_id}
        )
        return result.deleted_count > 0
