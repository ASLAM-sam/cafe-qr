from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Response, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.dependencies import get_db, get_current_tenant_cafe
from app.core.rate_limit import public_rate_limiter
from app.repositories.table_repository import TableRepository
from app.repositories.cafe_repository import CafeRepository
from app.services.table_service import TableService
from app.schemas.table import TableCreate, TableUpdate, TableResponse

router = APIRouter(tags=["Tables"])


@router.get("/api/public/table/{qr_token}")
@router.get("/public/table/{qr_token}")
async def resolve_table(
    qr_token: str,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Public customer endpoint: look up a dining table by its scanned QR token."""
    public_rate_limiter.check(request)
    table_repo = TableRepository(db)
    cafe_repo = CafeRepository(db)
    service = TableService(table_repo, cafe_repo)
    return await service.resolve_qr_token(qr_token)


@router.get("/api/tables", response_model=List[TableResponse])
@router.get("/api/admin/tables", response_model=List[TableResponse])
async def list_admin_tables(
    current_cafe: Dict[str, Any] = Depends(get_current_tenant_cafe),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Authenticated café admin endpoint: fetch all tables for this café."""
    table_repo = TableRepository(db)
    cafe_repo = CafeRepository(db)
    service = TableService(table_repo, cafe_repo)
    return await service.list_tables(current_cafe["cafe_id"])


@router.post("/api/tables", response_model=TableResponse, status_code=status.HTTP_201_CREATED)
async def create_table(
    data: TableCreate,
    current_cafe: Dict[str, Any] = Depends(get_current_tenant_cafe),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Authenticated café admin endpoint: create a new table with secure QR token."""
    table_repo = TableRepository(db)
    cafe_repo = CafeRepository(db)
    service = TableService(table_repo, cafe_repo)
    return await service.create_table(current_cafe["cafe_id"], data.table_number)


@router.get("/api/tables/{table_id}", response_model=TableResponse)
async def get_table(
    table_id: str,
    current_cafe: Dict[str, Any] = Depends(get_current_tenant_cafe),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Authenticated café admin endpoint: get table information."""
    table_repo = TableRepository(db)
    cafe_repo = CafeRepository(db)
    service = TableService(table_repo, cafe_repo)
    return await service.get_table(current_cafe["cafe_id"], table_id)


@router.put("/api/tables/{table_id}", response_model=TableResponse)
async def update_table(
    table_id: str,
    data: TableUpdate,
    current_cafe: Dict[str, Any] = Depends(get_current_tenant_cafe),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Authenticated café admin endpoint: update table number or status."""
    table_repo = TableRepository(db)
    cafe_repo = CafeRepository(db)
    service = TableService(table_repo, cafe_repo)
    return await service.update_table(current_cafe["cafe_id"], table_id, data.model_dump())


@router.delete("/api/tables/{table_id}")
async def delete_table(
    table_id: str,
    current_cafe: Dict[str, Any] = Depends(get_current_tenant_cafe),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Authenticated café admin endpoint: delete a table."""
    table_repo = TableRepository(db)
    cafe_repo = CafeRepository(db)
    service = TableService(table_repo, cafe_repo)
    await service.delete_table(current_cafe["cafe_id"], table_id)
    return {"success": True, "message": "Table deleted successfully."}


@router.get("/api/tables/{table_id}/qr")
async def download_table_qr(
    table_id: str,
    current_cafe: Dict[str, Any] = Depends(get_current_tenant_cafe),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Authenticated café admin endpoint: generate high-resolution PNG image of the table QR code."""
    table_repo = TableRepository(db)
    cafe_repo = CafeRepository(db)
    service = TableService(table_repo, cafe_repo)
    png_bytes = await service.generate_qr_png_bytes(current_cafe["cafe_id"], table_id)
    return Response(
        content=png_bytes,
        media_type="image/png",
        headers={"Content-Disposition": f'inline; filename="table-{table_id}-qr.png"'}
    )
