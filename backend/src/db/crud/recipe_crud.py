import json
from typing import Any, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.src.api.schemas.recipe import Ingredient
from backend.src.db.models.db_recipe import Recipe, PreparingSession, RecipeIngredient


async def get_recipe_by_id(db: AsyncSession, recipe_id: int) -> Optional[Recipe]:
    """Retrieve a recipe by its ID."""
    result = await db.execute(
        select(Recipe)
        .options(selectinload(Recipe.ingredients))
        .filter(Recipe.id == recipe_id)
    )
    return result.scalar_one_or_none()

async def get_recipes_by_preparing_session_id(db: AsyncSession, preparing_session_id: int) -> Optional[List[Recipe]]:
    """Retrieve the last three recipes by preparing session ID."""
     # Step 1: Get the preparing session
    result = await db.execute(select(PreparingSession).where(PreparingSession.id == preparing_session_id))
    preparing_session = result.scalars().first()

    if not preparing_session or not preparing_session.context_suggestions:
        return None

    # Step 2: Parse recipe IDs from JSON string
    try:
        recipe_ids = json.loads(preparing_session.context_suggestions)
        if not isinstance(recipe_ids, list):
            return None
    except (json.JSONDecodeError, TypeError):
        return None

    # Step 3: Get the last three recipe IDs (preserve order if possible)
    last_three_ids = recipe_ids[-3:]

    # Step 4: Fetch the recipes from the DB
    result = await db.execute(
        select(Recipe)
        .options(selectinload(Recipe.ingredients))
        .where(Recipe.id.in_(last_three_ids))
    )
    return result.scalars().all()

async def get_all_recipes_by_user_id(db: AsyncSession, user_id: str) -> List[Recipe]:
    """Retrieve all recipes for a given user ID."""
    result = await db.execute(
        select(Recipe)
        .options(selectinload(Recipe.ingredients))
        .filter(Recipe.user_id == user_id)
    )
    return result.scalars().all()

async def create_recipe(db: AsyncSession,
                user_id: str,
                title: str,
                description: str,
                ingredients: Optional[List[Ingredient]] = None,
                instructions: str = "[]",
                image_url: Optional[str] = None,
                is_permanent: bool = False) -> Recipe:
    """Create a new recipe in the database."""
    recipe = Recipe(
        user_id=user_id,
        title=title,
        description=description,
        instructions=instructions,
        image_url=image_url,
        is_permanent=is_permanent,
    )

    for ingredient in ingredients or []:
        payload = _ingredient_to_payload(ingredient)
        recipe.ingredients.append(
            RecipeIngredient(
                name=payload["name"],
                quantity=payload.get("quantity"),
                unit=payload.get("unit"),
            )
        )

    db.add(recipe)
    await db.commit()
    await db.refresh(recipe, attribute_names=["ingredients"])
    return recipe

async def update_recipe(db: AsyncSession,
                recipe_id: int,
                title: Optional[str] = None,
                description: Optional[str] = None,
                ingredients: Optional[List[Ingredient]] = None,
                instructions: Optional[str] = None,
                image_url: Optional[str] = None,
                is_permanent: Optional[bool] = None) -> Optional[Recipe]:
    """Update an existing recipe in the database."""
    result = await db.execute(
        select(Recipe)
        .options(selectinload(Recipe.ingredients))
        .filter(Recipe.id == recipe_id)
    )
    recipe = result.scalar_one_or_none()
    if not recipe:
        return None
    if title is not None:
        recipe.title = title
    if description is not None:
        recipe.description = description
    if ingredients is not None:
        _sync_recipe_ingredients(recipe, ingredients)
    if instructions is not None:
        recipe.instructions = instructions
    if image_url is not None:
        recipe.image_url = image_url
    if is_permanent is not None:
        recipe.is_permanent = is_permanent

    db.add(recipe)
    await db.commit()
    await db.refresh(recipe, attribute_names=["ingredients"])
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


def _sync_recipe_ingredients(recipe: Recipe, incoming_ingredients: List[Ingredient]) -> None:
    """Upsert recipe ingredients to match the incoming payload."""
    normalized_payload = [_ingredient_to_payload(item) for item in incoming_ingredients]

    existing_by_id = {ingredient.id: ingredient for ingredient in recipe.ingredients if ingredient.id is not None}
    retained_ids = set()

    for payload in normalized_payload:
        name = payload.get("name")
        if not name:
            raise ValueError("Ingredient name is required")

        ingredient_id = payload.get("id")
        if ingredient_id and ingredient_id in existing_by_id:
            target = existing_by_id[ingredient_id]
            target.name = name
            target.quantity = payload.get("quantity")
            target.unit = payload.get("unit")
            retained_ids.add(ingredient_id)
        else:
            recipe.ingredients.append(
                RecipeIngredient(
                    name=name,
                    quantity=payload.get("quantity"),
                    unit=payload.get("unit"),
                )
            )

    for ingredient in list(recipe.ingredients):
        if ingredient.id is not None and ingredient.id not in retained_ids and ingredient.id in existing_by_id:
            recipe.ingredients.remove(ingredient)


def _ingredient_to_payload(ingredient: Any) -> dict:
    """Normalize ingredient payload to a plain dictionary."""
    if ingredient is None:
        raise ValueError("Ingredient payload cannot be None")

    if hasattr(ingredient, "model_dump"):
        return ingredient.model_dump()
    if hasattr(ingredient, "dict"):
        return ingredient.dict()
    if isinstance(ingredient, dict):
        return ingredient

    raise ValueError("Unsupported ingredient payload type")