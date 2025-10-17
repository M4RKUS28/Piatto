from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, delete
from typing import List, Optional
from ..models.db_file import Image


############### IMAGES
async def get_image_by_id(db: AsyncSession, image_id: int) -> Optional[Image]:
    """Get image by ID"""
    result = await db.execute(select(Image).filter(Image.id == image_id))
    return result.scalar_one_or_none()


async def get_images_by_recipe_id(db: AsyncSession, recipe_id: int) -> List[Image]:
    """Get image for the recipe by ID"""
    result = await db.execute(select(Image).filter(Image.recipe_id == recipe_id))
    return result.scalars().all()


async def get_images_by_user_and_course(db: AsyncSession, user_id: str, recipe_id: int) -> List[Image]:
    """Get all images for a specific user and course"""
    result = await db.execute(
        select(Image).filter(and_(Image.user_id == user_id, Image.recipe_id == recipe_id))
    )
    return result.scalars().all()


async def create_image(
    db: AsyncSession,
    recipe_id: int,
    user_id: str,
    content_type: str,
    image_data: bytes,
) -> Image:
    """Create a new image"""
    db_image = Image(
        recipe_id=recipe_id,
        user_id=user_id,
        content_type=content_type,
        image_data=image_data,
    )
    db.add(db_image)
    await db.commit()
    await db.refresh(db_image)
    return db_image


async def update_image(db: AsyncSession, image_id: int, **kwargs) -> Optional[Image]:
    """Update image with provided fields"""
    result = await db.execute(select(Image).filter(Image.id == image_id))
    image = result.scalar_one_or_none()
    if image:
        for key, value in kwargs.items():
            if hasattr(image, key):
                setattr(image, key, value)
        await db.commit()
        await db.refresh(image)
    return image


async def delete_image(db: AsyncSession, image_id: int) -> bool:
    """Delete image by ID"""
    result = await db.execute(select(Image).filter(Image.id == image_id))
    image = result.scalar_one_or_none()
    if image:
        await db.delete(image)
        await db.commit()
        return True
    return False


async def delete_images_by_recipe(db: AsyncSession, recipe_id: int) -> int:
    """Delete all images for a specific course. Returns number of deleted images."""
    result = await db.execute(delete(Image).where(Image.recipe_id == recipe_id))
    await db.commit()
    return result.rowcount or 0


async def delete_images_by_user(db: AsyncSession, user_id: str) -> int:
    """Delete all images for a specific user. Returns number of deleted images."""
    result = await db.execute(delete(Image).where(Image.user_id == user_id))
    await db.commit()
    return result.rowcount or 0