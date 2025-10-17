from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from ...utils.auth import get_read_write_user_id
from ...db.database import get_db
from ...api.schemas.file import (
    ImageInfo
)
from ...db.models.db_file import Image

router = APIRouter(
    prefix="/files",
    tags=["files"],
    responses={404: {"description": "Not found"}},
)

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/gif": [".gif"],
    "image/webp": [".webp"],
}

# File size limits (in bytes)
MAX_DOCUMENT_SIZE = 30 * 1024 * 1024  # 30 MB TODO find suitable limit
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB


def validate_file_type(filename: str, content_type: str, allowed_types: dict) -> bool:
    """Validate if file type is allowed."""
    if content_type not in allowed_types:
        return False

    # Check file extension
    filename_lower = filename.lower()
    allowed_extensions = allowed_types[content_type]
    return any(filename_lower.endswith(ext) for ext in allowed_extensions)


async def verify_image_ownership(image_id: int, user_id: int, db: Session) -> Image:
    """Verify image belongs to current user."""
    image = db.query(Image).filter(
        Image.id == image_id,
        Image.user_id == user_id
    ).first()

    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found or access denied"
        )
    return image

# ========== IMAGE ENDPOINTS ==========

@router.post("/images", response_model=ImageInfo)
async def upload_image(
        file: UploadFile = File(...),
        current_user_id: str = Depends(get_read_write_user_id),
        db: AsyncSession = Depends(get_db)
):
    """Upload an image (JPEG, PNG, GIF, WebP)."""
    # Validate file type
    if not validate_file_type(file.filename, file.content_type, ALLOWED_IMAGE_TYPES):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image type not allowed. Allowed types: {list(ALLOWED_IMAGE_TYPES.keys())}"
        )

    # Read file data
    image_data = await file.read()
    file_size = len(image_data)

    # Validate file size
    if file_size > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image too large. Maximum size: {MAX_IMAGE_SIZE // (1024 * 1024)} MB"
        )

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file not allowed"
        )

    # Create image record
    image = Image(
        user_id=current_user_id,
        content_type=file.content_type,
        image_data=image_data,
    )

    db.add(image)
    await db.commit()
    await db.refresh(image)

    return image