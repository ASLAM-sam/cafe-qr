from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING


class ProductRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.products

    async def get_all(
        self,
        cafe_id: str,
        category_id: Optional[str] = None,
        available_only: bool = False,
        limit: int = 200,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {"cafe_id": cafe_id}
        if category_id:
            query["category_id"] = category_id
        if available_only:
            query["is_available"] = True

        cursor = self.collection.find(query, {"_id": 0}).sort("display_order", ASCENDING).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    async def get_by_id(self, cafe_id: str, product_id: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one(
            {"cafe_id": cafe_id, "product_id": product_id},
            {"_id": 0}
        )

    async def get_many_by_ids(self, cafe_id: str, product_ids: List[str]) -> List[Dict[str, Any]]:
        cursor = self.collection.find(
            {"cafe_id": cafe_id, "product_id": {"$in": product_ids}},
            {"_id": 0}
        )
        return await cursor.to_list(length=len(product_ids))

    async def create(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        product_data["created_at"] = now
        product_data["updated_at"] = now
        await self.collection.insert_one(product_data)
        product_data.pop("_id", None)
        return product_data

    async def update(
        self, cafe_id: str, product_id: str, update_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        update_data["updated_at"] = datetime.now(timezone.utc)
        result = await self.collection.find_one_and_update(
            {"cafe_id": cafe_id, "product_id": product_id},
            {"$set": update_data},
            return_document=True,
            projection={"_id": 0}
        )
        return result

    async def delete(self, cafe_id: str, product_id: str) -> bool:
        result = await self.collection.delete_one(
            {"cafe_id": cafe_id, "product_id": product_id}
        )
        return result.deleted_count > 0

    async def count(self, cafe_id: str) -> int:
        return await self.collection.count_documents({"cafe_id": cafe_id})
