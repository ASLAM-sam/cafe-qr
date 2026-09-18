from fastapi import APIRouter, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.dependencies import get_db, require_platform_admin
from app.repositories.cafe_repository import CafeRepository
from app.repositories.user_repository import UserRepository
from app.services.cafe_service import CafeService
from app.schemas.cafe import CafeCreate

router = APIRouter(prefix="/api/platform", tags=["Platform Admin"])


@router.post("/cafes", status_code=status.HTTP_201_CREATED)
async def platform_create_cafe(
    data: CafeCreate,
    _admin=Depends(require_platform_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Platform Admin endpoint: Provision a new café tenant and initial owner account.
    Validates unique subdomain and sets up base configuration.
    """
    cafe_repo = CafeRepository(db)
    user_repo = UserRepository(db)
    service = CafeService(cafe_repo, user_repo)
    return await service.create_cafe_and_owner(data.model_dump())
