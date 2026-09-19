import io
import logging
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
import cloudinary
import cloudinary.uploader
from app.core.config import settings

logger = logging.getLogger("cafe_qr.cloudinary")

ALLOWED_MIME_TYPES = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


class CloudinaryService:
    """Production service for Cloudinary image storage with tenant isolation."""

    def __init__(self):
        self.cloud_name = settings.CLOUDINARY_CLOUD_NAME
        self.api_key = settings.CLOUDINARY_API_KEY
        self.api_secret = settings.CLOUDINARY_API_SECRET
        if self.is_configured:
            cloudinary.config(
                cloud_name=self.cloud_name,
                api_key=self.api_key,
                api_secret=self.api_secret,
                secure=True,
            )

    @property
    def is_configured(self) -> bool:
        return bool(self.cloud_name and self.api_key and self.api_secret)

    def validate_image_file(self, content_type: str, file_size: int, filename: str) -> None:
        """Validate MIME type, extension, and file size."""
        if content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported image type '{content_type}'. Allowed types: JPG, PNG, WEBP.",
            )

        if file_size > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size ({round(file_size / (1024 * 1024), 2)}MB) exceeds maximum limit of 5MB.",
            )

        ext = f".{filename.rsplit('.', 1)[-1].lower()}" if "." in filename else ""
        if ext not in ALLOWED_MIME_TYPES[content_type]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File extension '{ext}' does not match content type '{content_type}'.",
            )

    async def upload_image(
        self,
        file_bytes: bytes,
        cafe_id: str,
        content_type: str = "image/jpeg",
        filename: str = "image.jpg",
        folder: str = "products",
    ) -> Dict[str, str]:
        """
        Upload image binary to Cloudinary scoped to cafe_id.
        Returns dict containing image_url and image_public_id.
        """
        self.validate_image_file(content_type, len(file_bytes), filename)

        if not self.is_configured:
            logger.error("Cloudinary credentials missing when upload attempted.")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Cloudinary image service is not configured. Please set CLOUDINARY credentials.",
            )

        target_folder = f"cafe_qr/cafes/{cafe_id}/{folder}"

        try:
            # Upload to Cloudinary with automatic optimization
            upload_result = cloudinary.uploader.upload(
                file_bytes,
                folder=target_folder,
                resource_type="image",
                overwrite=True,
                transformation=[
                    {"quality": "auto", "fetch_format": "auto"}
                ],
            )
            return {
                "image_url": upload_result.get("secure_url", upload_result.get("url")),
                "image_public_id": upload_result.get("public_id"),
            }
        except Exception as e:
            logger.error(f"Cloudinary upload failed for cafe {cafe_id}: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to upload image to Cloudinary. Please try again.",
            )

    async def delete_image(self, public_id: str, cafe_id: Optional[str] = None) -> bool:
        """
        Delete image from Cloudinary by public ID.
        If cafe_id is provided, enforces that the public_id belongs to that cafe.
        """
        if not public_id:
            return False

        if not self.is_configured:
            logger.warning(f"Cloudinary not configured; skipped deleting public_id {public_id}")
            return False

        # Tenant isolation check on Cloudinary public IDs
        if cafe_id and f"cafes/{cafe_id}/" not in public_id:
            logger.warning(
                f"Security: Tenant {cafe_id} attempted to delete non-owned public_id: {public_id}"
            )
            return False

        try:
            result = cloudinary.uploader.destroy(public_id, invalidate=True)
            return result.get("result") in ["ok", "not found"]
        except Exception as e:
            logger.error(f"Cloudinary deletion failed for {public_id}: {e}", exc_info=True)
            # Do not re-raise; image deletion failure must not break DB transaction
            return False


cloudinary_service = CloudinaryService()
