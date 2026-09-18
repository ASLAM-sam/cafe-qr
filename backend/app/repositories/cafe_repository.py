from datetime import datetime, timezone
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase


class CafeRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.cafes

    async def get_by_id(self, cafe_id: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one({"cafe_id": cafe_id}, {"_id": 0})

    async def get_by_subdomain(self, subdomain: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one(
            {"subdomain": subdomain.lower(), "status": "ACTIVE"},
            {"_id": 0}
        )

    async def create(self, cafe_data: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        cafe_data["created_at"] = now
        cafe_data["updated_at"] = now
        await self.collection.insert_one(cafe_data)
        cafe_data.pop("_id", None)
        return cafe_data

    async def update(self, cafe_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        update_data["updated_at"] = datetime.now(timezone.utc)
        result = await self.collection.find_one_and_update(
            {"cafe_id": cafe_id},
            {"$set": update_data},
            return_document=True,
            projection={"_id": 0}
        )
        return result
