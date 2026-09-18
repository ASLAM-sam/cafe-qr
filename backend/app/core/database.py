import logging
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, IndexModel
from app.core.config import settings

logger = logging.getLogger("cafe_qr.database")


class Database:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None


db_state = Database()


def get_database() -> AsyncIOMotorDatabase:
    """Return the active database instance."""
    if db_state.db is None:
        raise RuntimeError("Database is not connected. Ensure connect_to_mongo was called.")
    return db_state.db


async def connect_to_mongo():
    """Initialize MongoDB client and verify connectivity."""
    try:
        db_state.client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=5000,
            maxPoolSize=50,
            minPoolSize=5,
        )
        db_state.db = db_state.client[settings.MONGODB_DATABASE]
        # Ping server
        await db_state.client.admin.command("ping")
        logger.info("Successfully connected to MongoDB Atlas / instance.")
        await create_indexes()
    except Exception as e:
        logger.warning(f"MongoDB initial connection warning: {e}. App will start, but DB operations will retry.")


async def close_mongo_connection():
    """Close MongoDB client connection cleanly."""
    if db_state.client is not None:
        db_state.client.close()
        logger.info("Closed MongoDB connection.")


async def create_indexes():
    """Create essential multi-tenant and unique indexes."""
    if db_state.db is None:
        return
    try:
        # Cafes: unique subdomain
        await db_state.db.cafes.create_indexes([
            IndexModel([("subdomain", ASCENDING)], unique=True, name="idx_cafe_subdomain"),
            IndexModel([("cafe_id", ASCENDING)], unique=True, name="idx_cafe_id"),
        ])

        # Users: unique email, cafe_id
        await db_state.db.users.create_indexes([
            IndexModel([("email", ASCENDING)], unique=True, name="idx_user_email"),
            IndexModel([("cafe_id", ASCENDING)], name="idx_user_cafe"),
        ])

        # Categories: cafe_id + display_order
        await db_state.db.categories.create_indexes([
            IndexModel([("cafe_id", ASCENDING)], name="idx_cat_cafe"),
            IndexModel([("cafe_id", ASCENDING), ("name", ASCENDING)], name="idx_cat_cafe_name"),
            IndexModel([("cafe_id", ASCENDING), ("display_order", ASCENDING)], name="idx_cat_order"),
        ])

        # Products: cafe_id + category_id, availability
        await db_state.db.products.create_indexes([
            IndexModel([("cafe_id", ASCENDING)], name="idx_prod_cafe"),
            IndexModel([("cafe_id", ASCENDING), ("category_id", ASCENDING)], name="idx_prod_category"),
            IndexModel([("cafe_id", ASCENDING), ("is_available", ASCENDING)], name="idx_prod_avail"),
        ])

        # Tables: cafe_id + table_number (unique per cafe), qr_token (globally unique)
        await db_state.db.tables.create_indexes([
            IndexModel([("cafe_id", ASCENDING), ("table_number", ASCENDING)], unique=True, name="idx_table_number"),
            IndexModel([("qr_token", ASCENDING)], unique=True, name="idx_table_token"),
            IndexModel([("cafe_id", ASCENDING)], name="idx_table_cafe"),
        ])

        # Orders: cafe_id + order_status, created_at, order_reference (unique)
        await db_state.db.orders.create_indexes([
            IndexModel([("cafe_id", ASCENDING)], name="idx_order_cafe"),
            IndexModel([("cafe_id", ASCENDING), ("order_status", ASCENDING)], name="idx_order_status"),
            IndexModel([("cafe_id", ASCENDING), ("created_at", ASCENDING)], name="idx_order_created"),
            IndexModel([("order_reference", ASCENDING)], unique=True, name="idx_order_ref"),
        ])
        logger.info("Ensured all MongoDB multi-tenant indexes.")
    except Exception as e:
        logger.error(f"Error creating MongoDB indexes: {e}")
