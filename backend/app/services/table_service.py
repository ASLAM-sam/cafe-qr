import io
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
import qrcode
from app.repositories.table_repository import TableRepository
from app.repositories.cafe_repository import CafeRepository
from app.utils.ids import generate_id, generate_qr_token
from app.core.config import settings


class TableService:
    def __init__(self, table_repo: TableRepository, cafe_repo: CafeRepository):
        self.table_repo = table_repo
        self.cafe_repo = cafe_repo

    async def list_tables(self, cafe_id: str) -> List[Dict[str, Any]]:
        tables = await self.table_repo.get_all(cafe_id)
        # Attach public QR link for frontend display
        for t in tables:
            t["qr_url"] = f"{settings.FRONTEND_URL}/t/{t['qr_token']}"
        return tables

    async def get_table(self, cafe_id: str, table_id: str) -> Dict[str, Any]:
        table = await self.table_repo.get_by_id(cafe_id, table_id)
        if not table:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table not found.")
        table["qr_url"] = f"{settings.FRONTEND_URL}/t/{table['qr_token']}"
        return table

    async def resolve_qr_token(
        self, qr_token: str, expected_subdomain: Optional[str] = None
    ) -> Dict[str, Any]:
        """Public endpoint: look up a table by its QR token."""
        table = await self.table_repo.get_by_qr_token(qr_token)
        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid table QR code.",
            )
        cafe = await self.cafe_repo.get_by_id(table["cafe_id"])
        if not cafe or cafe.get("status") != "ACTIVE":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="The cafe associated with this table is currently unavailable.",
            )
        if expected_subdomain and expected_subdomain.lower() not in {"", "default", "none"}:
            if cafe["subdomain"].lower() != expected_subdomain.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Table QR code does not belong to the specified cafe.",
                )
        table["qr_url"] = f"{settings.FRONTEND_URL}/t/{table['qr_token']}"
        return {
            "table": table,
            "cafe": {
                "name": cafe["name"],
                "subdomain": cafe["subdomain"],
                "currency": cafe.get("currency", "INR"),
            }
        }

    async def create_table(self, cafe_id: str, table_number: str) -> Dict[str, Any]:
        cleaned_number = table_number.strip()
        existing = await self.table_repo.get_by_table_number(cafe_id, cleaned_number)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Table number '{cleaned_number}' already exists in this cafe.",
            )

        table_id = generate_id("tbl")
        qr_token = generate_qr_token()

        record = {
            "table_id": table_id,
            "cafe_id": cafe_id,
            "table_number": cleaned_number,
            "qr_token": qr_token,
            "status": "AVAILABLE",
        }
        created = await self.table_repo.create(record)
        created["qr_url"] = f"{settings.FRONTEND_URL}/t/{qr_token}"
        return created

    async def update_table(
        self, cafe_id: str, table_id: str, data: Dict[str, Any]
    ) -> Dict[str, Any]:
        if "table_number" in data and data["table_number"]:
            cleaned_number = data["table_number"].strip()
            existing = await self.table_repo.get_by_table_number(cafe_id, cleaned_number)
            if existing and existing["table_id"] != table_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Table number '{cleaned_number}' already exists in this cafe.",
                )
            data["table_number"] = cleaned_number

        clean_update = {k: v for k, v in data.items() if v is not None}
        updated = await self.table_repo.update(cafe_id, table_id, clean_update)
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table not found.")
        updated["qr_url"] = f"{settings.FRONTEND_URL}/t/{updated['qr_token']}"
        return updated

    async def delete_table(self, cafe_id: str, table_id: str) -> bool:
        await self.get_table(cafe_id, table_id)
        return await self.table_repo.delete(cafe_id, table_id)

    async def generate_qr_png_bytes(
        self, cafe_id: str, table_id: str, base_url: Optional[str] = None
    ) -> bytes:
        """Generate high-resolution PNG image bytes for printable QR code."""
        table = await self.get_table(cafe_id, table_id)
        clean_base = (base_url or settings.FRONTEND_URL).rstrip("/")
        target_url = f"{clean_base}/t/{table['qr_token']}"

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        qr.add_data(target_url)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        return buffer.getvalue()

    async def generate_public_qr_png_bytes(
        self, qr_token: str, base_url: Optional[str] = None
    ) -> bytes:
        """Generate high-resolution PNG image bytes using secure public QR token."""
        table = await self.table_repo.get_by_qr_token(qr_token)
        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid table QR code.",
            )
        cafe = await self.cafe_repo.get_by_id(table["cafe_id"])
        if not cafe or cafe.get("status") != "ACTIVE":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="The cafe associated with this table is currently unavailable.",
            )

        clean_base = (base_url or settings.FRONTEND_URL).rstrip("/")
        target_url = f"{clean_base}/t/{table['qr_token']}"

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        qr.add_data(target_url)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        return buffer.getvalue()
