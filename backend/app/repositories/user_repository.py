from datetime import datetime, timezone
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase


class UserRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.users

    async def get_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one({"user_id": user_id}, {"_id": 0})

    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one({"email": email.strip().lower()}, {"_id": 0})

    async def get_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one({"username": username.strip().lower()}, {"_id": 0})

    async def create(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        if "email" in user_data and user_data["email"]:
            user_data["email"] = user_data["email"].strip().lower()
        if "username" in user_data and user_data["username"]:
            user_data["username"] = user_data["username"].strip().lower()
        user_data["created_at"] = now
        await self.collection.insert_one(user_data)
        user_data.pop("_id", None)
        return user_data

    async def update_password(self, user_id: str, new_password_hash: str) -> bool:
        now = datetime.now(timezone.utc)
        result = await self.collection.update_one(
            {"user_id": user_id},
            {"$set": {"password_hash": new_password_hash, "updated_at": now}}
        )
        return result.matched_count > 0

