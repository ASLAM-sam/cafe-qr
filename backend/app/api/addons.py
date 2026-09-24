from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.dependencies import get_db, get_current_tenant_cafe, get_public_subdomain
from app.repositories.addon_repository import AddonRepository
from app.repositories.cafe_repository import CafeRepository
from app.services.addon_service import AddonService
from app.schemas.addon import AddonGroupCreate, AddonGroupUpdate, AddonGroupResponse

router = APIRouter(tags=["Addons"])


# ─── Public Endpoints ────────────────────────────────────────────────────────


@router.get("/api/public/addons", response_model=List[AddonGroupResponse])
@router.get("/public/addons", response_model=List[AddonGroupResponse])
async def get_public_addons(
    product_id: Optional[str] = Query(None),
    subdomain: str = Depends(get_public_subdomain),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Public customer endpoint: fetch add-on groups for a product or all add-ons for the cafe."""
    cafe_repo = CafeRepository(db)
    cafe = await cafe_repo.get_by_subdomain(subdomain)
    if not cafe:
        return []

    addon_repo = AddonRepository(db)
    service = AddonService(addon_repo)
    groups = await service.list_addon_groups(
        cafe_id=cafe["cafe_id"],
        product_id=product_id,
    )
    # Filter to only show available items for customers
    for group in groups:
        group["items"] = [item for item in group.get("items", []) if item.get("is_available", True)]
    return groups


# ─── Admin Endpoints ─────────────────────────────────────────────────────────


@router.get("/api/admin/addons", response_model=List[AddonGroupResponse])
async def list_admin_addons(
    product_id: Optional[str] = Query(None),
    current_cafe: Dict[str, Any] = Depends(get_current_tenant_cafe),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Authenticated cafe admin: list all add-on groups."""
    addon_repo = AddonRepository(db)
    service = AddonService(addon_repo)
    return await service.list_addon_groups(
        cafe_id=current_cafe["cafe_id"],
        product_id=product_id,
    )


@router.post("/api/addons", response_model=AddonGroupResponse, status_code=status.HTTP_201_CREATED)
async def create_addon_group(
    data: AddonGroupCreate,
    current_cafe: Dict[str, Any] = Depends(get_current_tenant_cafe),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Authenticated cafe admin: create a new add-on group."""
    addon_repo = AddonRepository(db)
    service = AddonService(addon_repo)
    return await service.create_addon_group(
        current_cafe["cafe_id"],
        data.model_dump()
    )


@router.get("/api/addons/{addon_group_id}", response_model=AddonGroupResponse)
async def get_addon_group(
    addon_group_id: str,
    current_cafe: Dict[str, Any] = Depends(get_current_tenant_cafe),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Authenticated cafe admin: get add-on group details."""
    addon_repo = AddonRepository(db)
    service = AddonService(addon_repo)
    return await service.get_addon_group(current_cafe["cafe_id"], addon_group_id)


@router.put("/api/addons/{addon_group_id}", response_model=AddonGroupResponse)
async def update_addon_group(
    addon_group_id: str,
    data: AddonGroupUpdate,
    current_cafe: Dict[str, Any] = Depends(get_current_tenant_cafe),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Authenticated cafe admin: update add-on group."""
    addon_repo = AddonRepository(db)
    service = AddonService(addon_repo)
    return await service.update_addon_group(
        current_cafe["cafe_id"],
        addon_group_id,
        data.model_dump()
    )


@router.delete("/api/addons/{addon_group_id}")
async def delete_addon_group(
    addon_group_id: str,
    current_cafe: Dict[str, Any] = Depends(get_current_tenant_cafe),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Authenticated cafe admin: delete an add-on group."""
    addon_repo = AddonRepository(db)
    service = AddonService(addon_repo)
    await service.delete_addon_group(current_cafe["cafe_id"], addon_group_id)
    return {"success": True, "message": "Add-on group deleted successfully."}
