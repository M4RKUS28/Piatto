import json
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.db.models.db_recipe import Recipe, GenContext, CookingSession, PromptHistory

# UpdateRecipe (z.B. permanent)
# Create CookingSession
# Update CookingSession State
# Get RecipePreviews !
# Get Recipe !
# Get CookingSession !
# Get PromptHistory !

async def get_recipes_by_gen_context_id(db: AsyncSession, gen_context_id: int) -> Optional[List[Recipe]]:
    """Retrieve the last three recipes by generation context ID."""
     # Step 1: Get the generation context
    result = await db.execute(select(GenContext).where(GenContext.id == gen_context_id))
    gen_context = result.scalars().first()

    if not gen_context or not gen_context.context_suggestions:
        return None

    # Step 2: Parse recipe IDs from JSON string
    try:
        recipe_ids = json.loads(gen_context.context_suggestions)
        if not isinstance(recipe_ids, list):
            return None
    except (json.JSONDecodeError, TypeError):
        return None

    # Step 3: Get the last three recipe IDs (preserve order if possible)
    last_three_ids = recipe_ids[-3:]

    # Step 4: Fetch the recipes from the DB
    result = await db.execute(
        select(Recipe).where(Recipe.id.in_(last_three_ids))
    )
    return result.scalars().all()

async def get_recipe_by_id(db: AsyncSession, recipe_id: int) -> Optional[Recipe]:
    """Retrieve a recipe by its ID."""
    result = await db.execute(select(Recipe).filter(Recipe.id == recipe_id))
    return result.scalar_one_or_none()

async def get_cooking_session_by_id(db: AsyncSession, cooking_session_id: int) -> Optional[CookingSession]:
    """Retrieve a cooking session by its ID."""
    result = await db.execute(select(CookingSession).filter(CookingSession.id == cooking_session_id))
    return result.scalar_one_or_none()

async def get_prompt_history_by_cooking_session_id(db: AsyncSession, cooking_session_id: int) -> Optional[PromptHistory]:
    """Retrieve the prompt history by cooking session ID."""

    # Step 1: Get the cooking session to know its current state
    result = await db.execute(select(CookingSession).where(CookingSession.id == cooking_session_id))
    cooking_session = result.scalars().first()

    if not cooking_session:
        return None

    # Step 2: Get the matching prompt history (same session and same state)
    result = await db.execute(select(PromptHistory)
        .where(
            PromptHistory.cooking_session_id == cooking_session.id,
            PromptHistory.state == cooking_session.state,
        )
        .order_by(PromptHistory.created_at.desc())  # optional: in case multiple entries exist
    )

    return result.scalars().first()





async def create_user(db: AsyncSession,
                user_id: str,
                username: str,
                email: str, hashed_password: str,
                is_active=True,
                role=UserRole.USER.value,
                profile_image_base64=None,
                theme: str = ThemePreference.LIGHT.value,
                language: str = "en"):
    """Create a new user in the database."""
    if isinstance(theme, ThemePreference):
        theme = theme.value
    normalized_language = (language or "en").strip().lower()
    primary_language = normalized_language.split("-")[0]
    sanitized_language = primary_language[:10] if primary_language else "en"

    user = User(
        id=user_id,
        username=username,
        email=email,
        hashed_password=hashed_password,
        is_active=is_active,
        role=role,
        theme=theme,
        language=sanitized_language or "en",
    )
    if profile_image_base64:
        user.profile_image_base64 = profile_image_base64
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user