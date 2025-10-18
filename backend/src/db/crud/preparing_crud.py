import json
from typing import List, Optional
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.schemas.recipe import Ingredient
from ..models.db_recipe import Recipe, PreparingSession


async def create_or_update_preparing_session(
    db: AsyncSession,
    user_id: str,
    prompt: str,
    recipe_id: int,
    preparing_session_id: Optional[int] = None
) -> PreparingSession:
    """Create a new preparing session or update existing one with new recipe."""
    if preparing_session_id:
        # Update existing session
        result = await db.execute(
            select(PreparingSession).filter(PreparingSession.id == preparing_session_id)
        )
        session = result.scalar_one_or_none()
        if session:
            # Parse existing recipe IDs and append new one
            try:
                recipe_ids = json.loads(session.context_suggestions or "[]")
            except (json.JSONDecodeError, TypeError):
                recipe_ids = []
            
            if recipe_id not in recipe_ids:
                recipe_ids.append(recipe_id)
            
            session.context_suggestions = json.dumps(recipe_ids)
            
            # Update prompts
            try:
                prompts = json.loads(session.context_promts or "[]")
            except (json.JSONDecodeError, TypeError):
                prompts = []
            prompts.append(prompt)
            session.context_promts = json.dumps(prompts)
            
            await db.commit()
            await db.refresh(session)
            return session
    
    # Create new session
    new_session = PreparingSession(
        user_id=user_id,
        context_promts=json.dumps([prompt]),
        context_suggestions=json.dumps([recipe_id])
    )
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    return new_session

async def delete_preparing_session(db: AsyncSession,
                               preparing_session_id: int) -> bool:
    """Delete a preparing session from the database."""
    result = await db.execute(select(PreparingSession).filter(PreparingSession.id == preparing_session_id))
    preparing_session = result.scalar_one_or_none()
    if not preparing_session:
        return False
    
    await db.execute(
        delete(Recipe)
        .where(Recipe.user_id == preparing_session.user_id)
        .where(Recipe.is_permanent == False)
    )

    await db.delete(preparing_session)
    await db.commit()
    return True