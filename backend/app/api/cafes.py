from typing import Dict, Any
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.dependencies import get_db, get_current_tenant_cafe, get_public_subdomain
from app.repositories.cafe_repository import CafeRepository
from app.repositories.user_repository import UserRepository
from app.services.cafe_service import CafeService
from app.schemas.cafe import CafeResponse, PublicCafeResponse, CafeUpdate

router = APIRouter(tags=["Cafés"])


@router.get("/api/public/cafe", response_model=PublicCafeResponse)
@router.get("/public/cafe", response_model=PublicCafeResponse)
async def get_public_cafe(
    subdomain: str = Depends(get_public_subdomain),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Public customer endpoint: fetch café branding and basic settings by subdomain."""
    cafe_repo = CafeRepository(db)
    user_repo = UserRepository(db)
    service = CafeService(cafe_repo, user_repo)
    return await service.get_public_cafe_by_subdomain(subdomain)


@router.get("/api/cafe", response_model=CafeResponse)
async def get_current_cafe(
    current_cafe: Dict[str, Any] = Depends(get_current_tenant_cafe),
):
    """Authenticated café admin endpoint: fetch current café profile and configurations."""
    return current_cafe


@router.put("/api/cafe", response_model=CafeResponse)
async def update_current_cafe(
    update_data: CafeUpdate,
    current_cafe: Dict[str, Any] = Depends(get_current_tenant_cafe),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Authenticated café admin endpoint: update branding, contact info, and tax settings."""
    cafe_repo = CafeRepository(db)
    user_repo = UserRepository(db)
    service = CafeService(cafe_repo, user_repo)
    return await service.update_cafe(current_cafe["cafe_id"], update_data.model_dump())
