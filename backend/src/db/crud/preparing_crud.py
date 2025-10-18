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
    recipe_ids: List[int],
    image_key: Optional[str] = None,
    analyzed_ingredients: Optional[str] = None,
    preparing_session_id: Optional[int] = None,
) -> PreparingSession:
    """Create a new preparing session or update an existing one with recipe suggestions."""
    if not isinstance(recipe_ids, list):
        recipe_ids = [recipe_ids]
    recipe_ids = [int(recipe_id) for recipe_id in recipe_ids if recipe_id is not None]

    if preparing_session_id:
        # Update existing session
        result = await db.execute(
            select(PreparingSession).filter(PreparingSession.id == preparing_session_id)
        )
        session = result.scalar_one_or_none()
        if session:
            # Parse existing recipe IDs and append new one
            try:
                existing_recipe_ids = json.loads(session.context_suggestions or "[]")
            except (json.JSONDecodeError, TypeError):
                existing_recipe_ids = []

            if recipe_ids:
                merged_ids = [int(recipe_id) for recipe_id in existing_recipe_ids if recipe_id is not None]
                for recipe_id in recipe_ids:
                    if recipe_id not in merged_ids:
                        merged_ids.append(recipe_id)

                session.context_suggestions = json.dumps(merged_ids)
            
            # Update prompts
            try:
                prompts = json.loads(session.context_promts or "[]")
            except (json.JSONDecodeError, TypeError):
                prompts = []
            prompts.append(prompt)
            session.context_promts = json.dumps(prompts)

            if image_key is not None:
                session.image_key = image_key
            if analyzed_ingredients is not None:
                session.analyzed_ingredients = analyzed_ingredients
            
            await db.commit()
            await db.refresh(session)
            return session
    
    # Create new session
    new_session = PreparingSession(
        user_id=user_id,
        context_promts=json.dumps([prompt]),
        context_suggestions=json.dumps(recipe_ids),
        image_key=image_key,
        analyzed_ingredients=analyzed_ingredients,
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


async def get_image_analysis_by_session_id(
    db: AsyncSession,
    preparing_session_id: int,
) -> Optional[dict]:
    """Return the uploaded image key and analyzed ingredients for a preparing session."""
    result = await db.execute(
        select(PreparingSession).filter(PreparingSession.id == preparing_session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        return None

    return {
        "image_key": session.image_key,
        "analyzed_ingredients": session.analyzed_ingredients,
    }