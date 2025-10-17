import json
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.api.schemas.recipe import Ingredient
from backend.src.db.models.db_recipe import Recipe, GenContext, CookingSession, PromptHistory


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

    #TODO Create new prompt history if not exists

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
    prompt_history = result.scalars().first()

    if not prompt_history:
        prompt_history = PromptHistory(
            cooking_session_id=cooking_session.id,
            state=cooking_session.state,
            prompts=json.dumps([]),     # start empty
            responses=json.dumps([]),   # start empty
        )
        db.add(prompt_history)
        await db.commit()
        await db.refresh(prompt_history)  # refresh to get the assigned ID

    return prompt_history

async def create_recipe(db: AsyncSession,
                user_id: str,
                title: str,
                description: str,
                ingredients: List[Ingredient],
                instructions: str,
                image_id: Optional[int] = None,
                is_permanent: bool = False) -> Recipe:
    """Create a new recipe in the database."""
    recipe = Recipe(
        user_id=user_id,
        title=title,
        description=description,
        ingredients=ingredients,
        instructions=instructions,
        image_id=image_id,
        is_permanent=is_permanent,
    )
    db.add(recipe)
    await db.commit()
    await db.refresh(recipe)
    return recipe

async def update_recipe(db: AsyncSession,
                recipe_id: int,
                user_id: Optional[str] = None,
                title: Optional[str] = None,
                description: Optional[str] = None,
                ingredients: Optional[str] = None,
                instructions: Optional[str] = None,
                image_url: Optional[str] = None,
                is_permanent: Optional[bool] = None) -> Optional[Recipe]:
    """Update an existing recipe in the database."""
    result = await db.execute(select(Recipe).filter(Recipe.id == recipe_id))
    recipe = result.scalar_one_or_none()
    if not recipe:
        return None

    if user_id is not None:
        recipe.user_id = user_id
    if title is not None:
        recipe.title = title
    if description is not None:
        recipe.description = description
    if ingredients is not None:
        recipe.ingredients = ingredients
    if instructions is not None:
        recipe.instructions = instructions
    if image_url is not None:
        recipe.image_url = image_url
    if is_permanent is not None:
        recipe.is_permanent = is_permanent

    db.add(recipe)
    await db.commit()
    await db.refresh(recipe)
    return recipe

async def create_cooking_session(db: AsyncSession,
                         user_id: str,
                         recipe_id: int) -> CookingSession:
    """Create a new cooking session in the database."""
    cooking_session = CookingSession(
        user_id=user_id,
        recipe_id=recipe_id,
        state=1,
    )
    db.add(cooking_session)
    await db.commit()
    await db.refresh(cooking_session)
    return cooking_session

async def update_cooking_session_state(db: AsyncSession,
                               cooking_session_id: int,
                               new_state: int) -> Optional[CookingSession]:
    """Update the state of an existing cooking session in the database."""
    result = await db.execute(select(CookingSession).filter(CookingSession.id == cooking_session_id))
    cooking_session = result.scalar_one_or_none()
    if not cooking_session:
        return None
    cooking_session.state = new_state
    db.add(cooking_session)
    await db.commit()
    await db.refresh(cooking_session)
    return cooking_session
