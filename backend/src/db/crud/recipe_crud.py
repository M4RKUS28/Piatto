import json
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.api.schemas.recipe import Ingredient
from backend.src.db.models.db_recipe import Recipe, GenContext


async def get_recipe_by_id(db: AsyncSession, recipe_id: int) -> Optional[Recipe]:
    """Retrieve a recipe by its ID."""
    result = await db.execute(select(Recipe).filter(Recipe.id == recipe_id))
    return result.scalar_one_or_none()

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

async def delete_recipe(db: AsyncSession, recipe_id: int) -> bool:
    """Delete a recipe from the database."""
    result = await db.execute(select(Recipe).filter(Recipe.id == recipe_id))
    recipe = result.scalar_one_or_none()
    if not recipe:
        return False
    await db.delete(recipe)
    await db.commit()
    return True