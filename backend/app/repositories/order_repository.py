from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import DESCENDING


class OrderRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.orders

    async def get_all(
        self,
        cafe_id: str,
        status: Optional[str] = None,
        limit: int = 50,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {"cafe_id": cafe_id}
        if status and status != "ALL":
            query["order_status"] = status
        cursor = self.collection.find(query, {"_id": 0}).sort("created_at", DESCENDING).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    async def get_by_id(self, cafe_id: str, order_id: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one(
            {"cafe_id": cafe_id, "order_id": order_id},
            {"_id": 0}
        )

    async def get_by_reference(self, order_reference: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one(
            {"order_reference": order_reference},
            {"_id": 0}
        )

    async def get_by_idempotency_key(
        self, cafe_id: str, idempotency_key: str
    ) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one(
            {"cafe_id": cafe_id, "idempotency_key": idempotency_key},
            {"_id": 0}
        )

    async def get_next_order_number(self, cafe_id: str) -> str:
        """Calculate next human-readable order number for the café (e.g. #1001)."""
        count = await self.collection.count_documents({"cafe_id": cafe_id})
        return f"{1001 + count}"

    async def get_dashboard_stats(self, cafe_id: str) -> Dict[str, int]:
        """Fetch live counts for the dashboard. If no orders exist, returns genuine 0s."""
        now = datetime.now(timezone.utc)
        start_of_day = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

        total_today = await self.collection.count_documents({
            "cafe_id": cafe_id,
            "created_at": {"$gte": start_of_day}
        })
        pending = await self.collection.count_documents({
            "cafe_id": cafe_id,
            "order_status": "PLACED"
        })
        preparing = await self.collection.count_documents({
            "cafe_id": cafe_id,
            "order_status": "PREPARING"
        })
        ready = await self.collection.count_documents({
            "cafe_id": cafe_id,
            "order_status": "READY"
        })
        completed = await self.collection.count_documents({
            "cafe_id": cafe_id,
            "order_status": "COMPLETED"
        })

        return {
            "total_orders_today": total_today,
            "pending_orders": pending,
            "preparing_orders": preparing,
            "ready_orders": ready,
            "completed_orders": completed,
        }

    async def create(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        order_data["created_at"] = now
        order_data["updated_at"] = now
        await self.collection.insert_one(order_data)
        order_data.pop("_id", None)
        return order_data

    async def update_status(
        self, cafe_id: str, order_id: str, new_status: str
    ) -> Optional[Dict[str, Any]]:
        result = await self.collection.find_one_and_update(
            {"cafe_id": cafe_id, "order_id": order_id},
            {
                "$set": {
                    "order_status": new_status,
                    "updated_at": datetime.now(timezone.utc)
                }
            },
            return_document=True,
            projection={"_id": 0}
        )
        return result
