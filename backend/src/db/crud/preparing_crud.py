import json
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ...api.schemas.recipe import Ingredient
from ..models.db_recipe import Recipe, PreparingSession


async def create_or_update_preparing_session(
    db: AsyncSession,
    user_id: str,
    recipe_ids: List[int],
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
            if session.user_id != user_id:
                raise PermissionError("Preparing session does not belong to the authenticated user.")

            existing_recipe_ids = _load_recipe_id_list(session.context_suggestions)
            if recipe_ids:
                merged_context_ids = _merge_unique_ids(existing_recipe_ids, recipe_ids)
                session.context_suggestions = json.dumps(merged_context_ids)

            # Update recipe relationships
            if recipe_ids:
                # Fetch the recipes and set their preparing_session_id
                result = await db.execute(select(Recipe).where(Recipe.id.in_(recipe_ids)))
                recipes = result.scalars().all()
                for recipe in recipes:
                    recipe.preparing_session_id = preparing_session_id

            await db.commit()
            await db.refresh(session)
            return session

    # Create new session
    serialized_ids = json.dumps(recipe_ids)
    new_session = PreparingSession(
        user_id=user_id,
        context_suggestions=serialized_ids,
    )
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)

    # Set recipes to belong to this session
    if recipe_ids:
        result = await db.execute(select(Recipe).where(Recipe.id.in_(recipe_ids)))
        recipes = result.scalars().all()
        for recipe in recipes:
            recipe.preparing_session_id = new_session.id
        await db.commit()
        await db.refresh(new_session)

    return new_session


async def delete_preparing_session(db: AsyncSession,
                               preparing_session_id: int,
                               user_id: str) -> bool:
    """Delete a preparing session from the database."""
    result = await db.execute(select(PreparingSession).filter(PreparingSession.id == preparing_session_id,
                                                             PreparingSession.user_id == user_id))
    preparing_session = result.scalar_one_or_none()
    if not preparing_session:
        return False
    
    recipes = await db.execute(
        select(Recipe)
        .where(Recipe.user_id == preparing_session.user_id)
        .where(Recipe.is_permanent == False)
    )
    for recipe in recipes.scalars():
        await db.delete(recipe)

    await db.delete(preparing_session)
    await db.commit()
    return True


async def remove_recipe_from_current(
    db: AsyncSession,
    preparing_session_id: int,
    user_id: str,
    recipe_id: int,
) -> Optional[List[int]]:
    """Remove a recipe from the active list for the given session."""
    session = await _get_session_for_user(db, preparing_session_id, user_id)
    if session is None:
        return None

    # Find the recipe and set its preparing_session_id to NULL
    target_id = int(recipe_id)
    result = await db.execute(
        select(Recipe).where(Recipe.id == target_id, Recipe.preparing_session_id == preparing_session_id)
    )
    recipe = result.scalar_one_or_none()

    if recipe:
        recipe.preparing_session_id = None
        await db.commit()

    # Return the current list of recipe IDs
    await db.refresh(session)
    return [r.id for r in session.current_recipes]


async def add_recipe_to_current(
    db: AsyncSession,
    preparing_session_id: int,
    user_id: str,
    recipe_id: int,
) -> Optional[List[int]]:
    """Re-add a recipe to the active list for the given session."""
    session = await _get_session_for_user(db, preparing_session_id, user_id)
    if session is None:
        return None

    # Find the recipe and set its preparing_session_id
    target_id = int(recipe_id)
    result = await db.execute(select(Recipe).where(Recipe.id == target_id))
    recipe = result.scalar_one_or_none()

    if recipe:
        # Only update if not already assigned to this session
        if recipe.preparing_session_id != preparing_session_id:
            recipe.preparing_session_id = preparing_session_id
            await db.commit()

    # Return the current list of recipe IDs
    await db.refresh(session)
    return [r.id for r in session.current_recipes]


async def _get_session_for_user(
    db: AsyncSession,
    preparing_session_id: int,
    user_id: str,
) -> Optional[PreparingSession]:
    result = await db.execute(
        select(PreparingSession)
        .options(selectinload(PreparingSession.current_recipes))
        .filter(PreparingSession.id == preparing_session_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        return None
    if session.user_id != user_id:
        raise PermissionError("Preparing session does not belong to the authenticated user.")
    return session


def _load_recipe_id_list(raw_value: Optional[str]) -> List[int]:
    """Parse a JSON encoded list of recipe identifiers."""
    if not raw_value:
        return []
    try:
        payload = json.loads(raw_value)
    except (json.JSONDecodeError, TypeError):
        return []
    if not isinstance(payload, list):
        return []
    result: List[int] = []
    for item in payload:
        try:
            result.append(int(item))
        except (TypeError, ValueError):
            continue
    return result


def _load_prompt_history(raw_value: Optional[str]) -> List[str]:
    """Parse stored prompts as a list of strings."""
    if not raw_value:
        return []
    try:
        payload = json.loads(raw_value)
    except (json.JSONDecodeError, TypeError):
        return []
    if not isinstance(payload, list):
        return []
    return [str(item) for item in payload]


def _merge_unique_ids(existing: List[int], additions: List[int]) -> List[int]:
    """Append new identifiers while preserving order and uniqueness."""
    merged = list(existing)
    for recipe_id in additions:
        if recipe_id not in merged:
            merged.append(recipe_id)
    return merged