from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from app.repositories.cafe_repository import CafeRepository
from app.repositories.user_repository import UserRepository
from app.core.security import hash_password
from app.utils.ids import generate_id, normalize_subdomain


class CafeService:
    def __init__(self, cafe_repo: CafeRepository, user_repo: UserRepository):
        self.cafe_repo = cafe_repo
        self.user_repo = user_repo

    async def get_public_cafe_by_subdomain(self, subdomain: str) -> Dict[str, Any]:
        cleaned_subdomain = subdomain.strip().lower()
        cafe = await self.cafe_repo.get_by_subdomain(cleaned_subdomain)
        if not cafe:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cafe with subdomain '{cleaned_subdomain}' was not found or is inactive.",
            )

        # Return strictly public branding fields (no sensitive internal IDs or timestamps)
        return {
            "name": cafe["name"],
            "subdomain": cafe["subdomain"],
            "description": cafe.get("description"),
            "phone": cafe.get("phone"),
            "email": cafe.get("email"),
            "address": cafe.get("address"),
            "currency": cafe.get("currency", "INR"),
            "logo": cafe.get("logo_url"),
            "banner": cafe.get("banner_url"),
            "primary_color": cafe.get("primary_color", "#0f172a"),
            "tax_settings": cafe.get("tax_settings"),
            "status": cafe.get("status", "ACTIVE"),
        }

    async def get_cafe_by_id(self, cafe_id: str) -> Dict[str, Any]:
        cafe = await self.cafe_repo.get_by_id(cafe_id)
        if not cafe:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cafe not found.")
        return cafe

    async def update_cafe(self, cafe_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        # Filter out None values
        clean_update = {k: v for k, v in update_data.items() if v is not None}
        updated = await self.cafe_repo.update(cafe_id, clean_update)
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cafe not found.")
        return updated

    async def list_all_cafes(self, limit: int = 100, skip: int = 0) -> list[Dict[str, Any]]:
        return await self.cafe_repo.get_all(limit=limit, skip=skip)

    async def create_cafe_and_owner(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Bootstrap a new café and owner account (Platform admin)."""
        subdomain = normalize_subdomain(data["subdomain"])

        # Check existing subdomain
        existing_cafe = await self.cafe_repo.get_by_subdomain(subdomain)
        if existing_cafe:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Subdomain '{subdomain}' is already taken.",
            )

        # Check existing owner email
        existing_user = await self.user_repo.get_by_email(data["owner_email"])
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists.",
            )

        cafe_id = generate_id("cafe")
        user_id = generate_id("user")

        cafe_record = {
            "cafe_id": cafe_id,
            "name": data["name"],
            "slug": subdomain,
            "subdomain": subdomain,
            "description": data.get("description"),
            "phone": data.get("phone"),
            "email": data.get("email") or data["owner_email"],
            "address": data.get("address"),
            "currency": data.get("currency", "INR"),
            "primary_color": data.get("primary_color", "#0f172a"),
            "secondary_color": data.get("secondary_color", "#f8fafc"),
            "tax_settings": data.get("tax_settings", {"tax_enabled": False, "tax_rate_percent": 0.0}),
            "status": "ACTIVE",
        }
        await self.cafe_repo.create(cafe_record)

        user_record = {
            "user_id": user_id,
            "cafe_id": cafe_id,
            "name": data["owner_name"],
            "email": data["owner_email"],
            "password_hash": hash_password(data["owner_password"]),
            "role": "OWNER",
            "status": "ACTIVE",
        }
        await self.user_repo.create(user_record)

        user_record.pop("password_hash", None)
        return {
            "cafe": cafe_record,
            "owner": user_record,
        }
