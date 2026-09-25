from fastapi import APIRouter, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.dependencies import get_db, require_platform_admin
from app.repositories.cafe_repository import CafeRepository
from app.repositories.user_repository import UserRepository
from app.services.cafe_service import CafeService
from app.services.auth_service import AuthService
from app.schemas.cafe import CafeCreate
from app.schemas.auth import ChangePasswordRequest

router = APIRouter(prefix="/api/platform", tags=["Platform Admin"])


@router.get("/cafes")
async def platform_list_cafes(
    _admin=Depends(require_platform_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Platform Admin endpoint: List all registered café tenants across the platform.
    Requires PLATFORM_ADMIN role.
    """
    cafe_repo = CafeRepository(db)
    user_repo = UserRepository(db)
    service = CafeService(cafe_repo, user_repo)
    return await service.list_all_cafes()


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


@router.post("/change-password")
async def platform_change_password(
    data: ChangePasswordRequest,
    admin=Depends(require_platform_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Platform Admin endpoint: Securely change Platform Admin password.
    Requires authenticated PLATFORM_ADMIN role.
    Requires current password verification before saving new password.
    """
    user_repo = UserRepository(db)
    cafe_repo = CafeRepository(db)
    auth_service = AuthService(user_repo, cafe_repo)
    return await auth_service.change_password(
        user_id=admin["user_id"],
        current_password=data.current_password,
        new_password=data.new_password,
    )


