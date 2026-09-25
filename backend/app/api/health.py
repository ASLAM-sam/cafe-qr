from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.dependencies import get_db
from app.core.postgres_database import check_postgres_connection

router = APIRouter(tags=["Health"])


@router.get("/")
async def root():
    """Root status endpoint reporting API availability."""
    return {
        "service": "Cafe QR Ordering API",
        "status": "ok",
    }


@router.get("/health")
@router.get("/api/health")
async def health_check(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Healthcheck endpoint reporting application, MongoDB, and PostgreSQL connectivity."""
    db_status = "disconnected"
    try:
        await db.command("ping")
        db_status = "connected"
    except Exception:
        db_status = "unreachable"

    pg_info = await check_postgres_connection()

    return {
        "status": "ok",
        "database": db_status,  # Preserved for backward compatibility
        "mongodb": db_status,
        "postgresql": pg_info.get("status", "not_configured"),
    }
