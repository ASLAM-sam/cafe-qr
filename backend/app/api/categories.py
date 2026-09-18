from typing import List, Dict, Any
from fastapi import APIRouter, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.dependencies import get_db, get_current_tenant_cafe, get_public_subdomain
from app.repositories.category_repository import CategoryRepository
from app.repositories.product_repository import ProductRepository
from app.repositories.cafe_repository import CafeRepository
from app.services.category_service import CategoryService
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse

router = APIRouter(tags=["Categories"])


@router.get("/api/public/categories", response_model=List[CategoryResponse])
async def get_public_categories(
    subdomain: str = Depends(get_public_subdomain),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Public customer endpoint: fetch active categories for the current café menu."""
    cafe_repo = CafeRepository(db)
    cafe = await cafe_repo.get_by_subdomain(subdomain)
    if not cafe:
        return []

    category_repo = CategoryRepository(db)
    product_repo = ProductRepository(db)
    service = CategoryService(category_repo, product_repo)
    return await service.list_categories(cafe["cafe_id"], active_only=True)


@router.get("/api/categories", response_model=List[CategoryResponse])
@router.get("/api/admin/categories", response_model=List[CategoryResponse])
async def list_admin_categories(
    current_cafe: Dict[str, Any] = Depends(get_current_tenant_cafe),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Authenticated café admin endpoint: fetch all categories for this café."""
    category_repo = CategoryRepository(db)
    product_repo = ProductRepository(db)
    service = CategoryService(category_repo, product_repo)
    return await service.list_categories(current_cafe["cafe_id"], active_only=False)


@router.post("/api/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate,
    current_cafe: Dict[str, Any] = Depends(get_current_tenant_cafe),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Authenticated café admin endpoint: create a new menu category."""
    category_repo = CategoryRepository(db)
    product_repo = ProductRepository(db)
    service = CategoryService(category_repo, product_repo)
    return await service.create_category(current_cafe["cafe_id"], data.model_dump())


@router.get("/api/categories/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: str,
    current_cafe: Dict[str, Any] = Depends(get_current_tenant_cafe),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Authenticated café admin endpoint: retrieve a single category."""
    category_repo = CategoryRepository(db)
    product_repo = ProductRepository(db)
    service = CategoryService(category_repo, product_repo)
    return await service.get_category(current_cafe["cafe_id"], category_id)


@router.put("/api/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    data: CategoryUpdate,
    current_cafe: Dict[str, Any] = Depends(get_current_tenant_cafe),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Authenticated café admin endpoint: update category attributes."""
    category_repo = CategoryRepository(db)
    product_repo = ProductRepository(db)
    service = CategoryService(category_repo, product_repo)
    return await service.update_category(current_cafe["cafe_id"], category_id, data.model_dump())


@router.delete("/api/categories/{category_id}")
async def delete_category(
    category_id: str,
    current_cafe: Dict[str, Any] = Depends(get_current_tenant_cafe),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Authenticated café admin endpoint: delete a category (guarantees orphan protection)."""
    category_repo = CategoryRepository(db)
    product_repo = ProductRepository(db)
    service = CategoryService(category_repo, product_repo)
    await service.delete_category(current_cafe["cafe_id"], category_id)
    return {"success": True, "message": "Category deleted successfully."}
