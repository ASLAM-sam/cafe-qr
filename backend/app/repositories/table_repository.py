from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING


class TableRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.tables

    async def get_all(self, cafe_id: str) -> List[Dict[str, Any]]:
        cursor = self.collection.find({"cafe_id": cafe_id}, {"_id": 0}).sort("table_number", ASCENDING)
        return await cursor.to_list(length=100)

    async def get_by_id(self, cafe_id: str, table_id: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one(
            {"cafe_id": cafe_id, "table_id": table_id},
            {"_id": 0}
        )

    async def get_by_qr_token(self, qr_token: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one({"qr_token": qr_token}, {"_id": 0})

    async def get_by_table_number(self, cafe_id: str, table_number: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one(
            {"cafe_id": cafe_id, "table_number": table_number},
            {"_id": 0}
        )

    async def create(self, table_data: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        table_data["created_at"] = now
        table_data["updated_at"] = now
        await self.collection.insert_one(table_data)
        table_data.pop("_id", None)
        return table_data

    async def update(
        self, cafe_id: str, table_id: str, update_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        update_data["updated_at"] = datetime.now(timezone.utc)
        result = await self.collection.find_one_and_update(
            {"cafe_id": cafe_id, "table_id": table_id},
            {"$set": update_data},
            return_document=True,
            projection={"_id": 0}
        )
        return result

    async def delete(self, cafe_id: str, table_id: str) -> bool:
        result = await self.collection.delete_one(
            {"cafe_id": cafe_id, "table_id": table_id}
        )
        return result.deleted_count > 0

    async def count(self, cafe_id: str) -> int:
        return await self.collection.count_documents({"cafe_id": cafe_id})
