from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.dependencies import get_db, get_current_tenant_cafe, get_public_subdomain
from app.repositories.product_repository import ProductRepository
from app.repositories.category_repository import CategoryRepository
from app.repositories.cafe_repository import CafeRepository
from app.services.product_service import ProductService
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter(tags=["Products"])


@router.get("/api/public/products", response_model=List[ProductResponse])
async def get_public_products(
    category_id: Optional[str] = Query(None),
    subdomain: str = Depends(get_public_subdomain),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Public customer endpoint: fetch available products for the digital menu."""
    cafe_repo = CafeRepository(db)
    cafe = await cafe_repo.get_by_subdomain(subdomain)
    if not cafe:
        return []

    product_repo = ProductRepository(db)
    category_repo = CategoryRepository(db)
    service = ProductService(product_repo, category_repo)
    return await service.list_products(
        cafe_id=cafe["cafe_id"],
        category_id=category_id,
        available_only=True,
    )


@router.get("/api/products", response_model=List[ProductResponse])
@router.get("/api/admin/products", response_model=List[ProductResponse])
async def list_admin_products(
    category_id: Optional[str] = Query(None),
    current_cafe: Dict[str, Any] = Depends(get_current_tenant_cafe),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Authenticated café admin endpoint: fetch all products."""
    product_repo = ProductRepository(db)
    category_repo = CategoryRepository(db)
    service = ProductService(product_repo, category_repo)
    return await service.list_products(
        cafe_id=current_cafe["cafe_id"],
        category_id=category_id,
        available_only=False,
    )


@router.post("/api/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    current_cafe: Dict[str, Any] = Depends(get_current_tenant_cafe),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Authenticated café admin endpoint: create a new product."""
    product_repo = ProductRepository(db)
    category_repo = CategoryRepository(db)
    service = ProductService(product_repo, category_repo)
    return await service.create_product(current_cafe["cafe_id"], data.model_dump())


@router.get("/api/products/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    current_cafe: Dict[str, Any] = Depends(get_current_tenant_cafe),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Authenticated café admin endpoint: get product details."""
    product_repo = ProductRepository(db)
    category_repo = CategoryRepository(db)
    service = ProductService(product_repo, category_repo)
    return await service.get_product(current_cafe["cafe_id"], product_id)


@router.put("/api/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    data: ProductUpdate,
    current_cafe: Dict[str, Any] = Depends(get_current_tenant_cafe),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Authenticated café admin endpoint: update product details, pricing, and availability."""
    product_repo = ProductRepository(db)
    category_repo = CategoryRepository(db)
    service = ProductService(product_repo, category_repo)
    return await service.update_product(current_cafe["cafe_id"], product_id, data.model_dump())


@router.delete("/api/products/{product_id}")
async def delete_product(
    product_id: str,
    current_cafe: Dict[str, Any] = Depends(get_current_tenant_cafe),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Authenticated café admin endpoint: delete a product."""
    product_repo = ProductRepository(db)
    category_repo = CategoryRepository(db)
    service = ProductService(product_repo, category_repo)
    await service.delete_product(current_cafe["cafe_id"], product_id)
    return {"success": True, "message": "Product deleted successfully."}
