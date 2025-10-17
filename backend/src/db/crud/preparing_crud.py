import json
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.api.schemas.recipe import Ingredient
from backend.src.db.models.db_recipe import Recipe, PreparingSession

# TODO

async def delete_preparing_session(db: AsyncSession, # TODO Delete related recipes as well
                               preparing_session_id: int) -> bool:
    """Delete a preparing session from the database."""
    result = await db.execute(select(PreparingSession).filter(PreparingSession.id == preparing_session_id))
    preparing_session = result.scalar_one_or_none()
    if not preparing_session:
        return False
    await db.delete(preparing_session)
    await db.commit()
    return True