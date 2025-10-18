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
            if session.user_id != user_id:
                raise PermissionError("Preparing session does not belong to the authenticated user.")

            existing_recipe_ids = _load_recipe_id_list(session.context_suggestions)
            if recipe_ids:
                merged_context_ids = _merge_unique_ids(existing_recipe_ids, recipe_ids)
                session.context_suggestions = json.dumps(merged_context_ids)

            existing_current_ids = _load_recipe_id_list(session.current_recipes)
            if recipe_ids:
                merged_current_ids = _merge_unique_ids(existing_current_ids, recipe_ids)
                session.current_recipes = json.dumps(merged_current_ids)

            prompts = _load_prompt_history(session.context_promts)
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
    serialized_ids = json.dumps(recipe_ids)
    new_session = PreparingSession(
        user_id=user_id,
        context_promts=json.dumps([prompt]),
        context_suggestions=serialized_ids,
        current_recipes=serialized_ids,
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

    current_ids = _load_recipe_id_list(session.current_recipes)
    target_id = int(recipe_id)
    filtered_ids = [rid for rid in current_ids if rid != target_id]
    if len(filtered_ids) == len(current_ids):
        return filtered_ids

    session.current_recipes = json.dumps(filtered_ids)
    await db.commit()
    await db.refresh(session)
    return filtered_ids


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

    current_ids = _load_recipe_id_list(session.current_recipes)
    target_id = int(recipe_id)
    if target_id in current_ids:
        return current_ids

    current_ids.append(target_id)
    session.current_recipes = json.dumps(current_ids)
    await db.commit()
    await db.refresh(session)
    return current_ids


async def _get_session_for_user(
    db: AsyncSession,
    preparing_session_id: int,
    user_id: str,
) -> Optional[PreparingSession]:
    result = await db.execute(
        select(PreparingSession).filter(PreparingSession.id == preparing_session_id)
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