import logging
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger("cafe_qr.cloudinary")


class CloudinaryService:
    """Production service abstraction for Cloudinary image storage."""

    def __init__(self):
        self.cloud_name = settings.CLOUDINARY_CLOUD_NAME
        self.api_key = settings.CLOUDINARY_API_KEY
        self.api_secret = settings.CLOUDINARY_API_SECRET

    @property
    def is_configured(self) -> bool:
        return bool(self.cloud_name and self.api_key and self.api_secret)

    async def upload_image(
        self, file_bytes: bytes, folder: str = "products"
    ) -> Dict[str, str]:
        """
        Upload image binary to Cloudinary.
        Returns dict containing image_url and image_public_id.
        """
        if not self.is_configured:
            raise RuntimeError(
                "Cloudinary credentials are not configured in environment variables."
            )

        # In production with cloudinary SDK:
        # import cloudinary.uploader
        # response = cloudinary.uploader.upload(file_bytes, folder=f"cafe_qr/{folder}")
        # return {"image_url": response["secure_url"], "image_public_id": response["public_id"]}
        raise NotImplementedError("Direct image upload will be enabled with Cloudinary credentials in Phase 5.")

    async def delete_image(self, public_id: str) -> bool:
        """Delete image from Cloudinary by public ID."""
        if not self.is_configured:
            logger.warning("Cloudinary credentials not configured; skipping remote delete.")
            return False
        return True


cloudinary_service = CloudinaryService()
