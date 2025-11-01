import json
from typing import Any, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ...api.schemas.recipe import Ingredient
from ..models.db_recipe import Recipe, PreparingSession, RecipeIngredient


async def get_recipe_by_id(db: AsyncSession, recipe_id: int) -> Optional[Recipe]:
    """Retrieve a recipe by its ID."""
    result = await db.execute(
        select(Recipe)
        .options(
            selectinload(Recipe.ingredients),
            selectinload(Recipe.instruction_steps)
        )
        .filter(Recipe.id == recipe_id)
    )
    return result.scalar_one_or_none()

async def get_recipes_by_user_id(db: AsyncSession, user_id: str) -> List[Recipe]:
    """Retrieve all permanent recipes for a user."""
    result = await db.execute(
        select(Recipe).filter(Recipe.user_id == user_id, Recipe.is_permanent == True)
    )
    return result.scalars().all()

async def get_recipes_by_preparing_session_id(db: AsyncSession, preparing_session_id: int) -> Optional[List[Recipe]]:
    """Retrieve the active recipes for a preparing session in creation order."""
    # Get the preparing session with current_recipes relationship eagerly loaded
    result = await db.execute(
        select(PreparingSession)
        .options(
            selectinload(PreparingSession.current_recipes)
            .selectinload(Recipe.ingredients)
        )
        .options(
            selectinload(PreparingSession.current_recipes)
            .selectinload(Recipe.instruction_steps)
        )
        .where(PreparingSession.id == preparing_session_id)
    )
    preparing_session = result.scalars().first()

    if not preparing_session:
        return None

    # Return the recipes from the relationship
    # If no current recipes, fall back to the last 3 from context_suggestions
    if preparing_session.current_recipes:
        return list(preparing_session.current_recipes)

    # Fallback: get the last 3 recipes from context_suggestions
    active_recipe_ids = _parse_recipe_id_list(preparing_session.context_suggestions)[-3:]
    if not active_recipe_ids:
        return []

    result = await db.execute(
        select(Recipe)
        .options(
            selectinload(Recipe.ingredients),
            selectinload(Recipe.instruction_steps)
        )
        .where(Recipe.id.in_(active_recipe_ids))
    )
    recipes = result.scalars().all()
    recipe_lookup = {recipe.id: recipe for recipe in recipes}
    return [recipe_lookup[recipe_id] for recipe_id in active_recipe_ids if recipe_id in recipe_lookup]

async def get_recipe_previews_by_preparing_session_id(db: AsyncSession, preparing_session_id: int) -> Optional[List[Recipe]]:
    """Retrieve the active recipes for a preparing session (lightweight - no ingredients/instructions)."""
    # Get the preparing session with current_recipes relationship eagerly loaded (no extra relations)
    result = await db.execute(
        select(PreparingSession)
        .options(
            selectinload(PreparingSession.current_recipes)
        )
        .where(PreparingSession.id == preparing_session_id)
    )

    preparing_session = result.scalars().first()


    if not preparing_session:
        return None

    # Return the recipes from the relationship
    # If no current recipes, fall back to the last 3 from context_suggestions
    if preparing_session.current_recipes:
        return list(preparing_session.current_recipes)


    # Fallback: get the last 3 recipes from context_suggestions
    active_recipe_ids = _parse_recipe_id_list(preparing_session.context_suggestions)[-3:]
    if not active_recipe_ids:
        return []

    result = await db.execute(
        select(Recipe)
        .where(Recipe.id.in_(active_recipe_ids))
    )

    recipes = result.scalars().all()
    recipe_lookup = {recipe.id: recipe for recipe in recipes}
    return [recipe_lookup[recipe_id] for recipe_id in active_recipe_ids if recipe_id in recipe_lookup]

async def get_all_recipes_by_user_id(db: AsyncSession, user_id: str) -> List[Recipe]:
    """Retrieve all recipes for a given user ID."""
    result = await db.execute(
        select(Recipe)
        .options(
            selectinload(Recipe.ingredients),
            selectinload(Recipe.instruction_steps)
        )
        .filter(Recipe.user_id == user_id)
        .order_by(Recipe.created_at.desc())
    )
    return result.scalars().all()

async def create_recipe(db: AsyncSession,
                user_id: str,
                title: str,
                description: str,
                prompt: str,
                ingredients: Optional[List[Ingredient]] = None,
                instructions: str = "[]",
                image_url: Optional[str] = None,
                is_permanent: bool = False,
                total_time_minutes: Optional[int] = None,
                difficulty: Optional[str] = None,
                food_category: Optional[str] = None,
                important_notes: Optional[str] = None,
                cooking_overview: Optional[str] = None) -> Recipe:
    """Create a new recipe in the database."""
    recipe = Recipe(
        user_id=user_id,
        title=title,
        description=description,
        prompt=prompt,
        instructions=instructions,
    important_notes=important_notes or "No special notes provided.",
    cooking_overview=cooking_overview or "Follow the instructions sequentially to complete the recipe.",
        image_url=image_url,
        is_permanent=is_permanent,
        total_time_minutes=total_time_minutes,
        difficulty=difficulty,
        food_category=food_category,
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
                prompt: Optional[str] = None,
                ingredients: Optional[List[Ingredient]] = None,
                instructions: Optional[str] = None,
                image_url: Optional[str] = None,
                is_permanent: Optional[bool] = None,
                total_time_minutes: Optional[int] = None,
                difficulty: Optional[str] = None,
                food_category: Optional[str] = None,
                important_notes: Optional[str] = None,
                cooking_overview: Optional[str] = None) -> Optional[Recipe]:
    """Update an existing recipe in the database."""
    result = await db.execute(
        select(Recipe)
        .options(
            selectinload(Recipe.ingredients),
            selectinload(Recipe.instruction_steps)
        )
        .filter(Recipe.id == recipe_id)
    )
    recipe = result.scalar_one_or_none()
    if not recipe:
        return None
    if title is not None:
        recipe.title = title
    if description is not None:
        recipe.description = description
    if prompt is not None:
        recipe.prompt = prompt
    if ingredients is not None:
        _sync_recipe_ingredients(recipe, ingredients)
    if instructions is not None:
        recipe.instructions = instructions
    if image_url is not None:
        recipe.image_url = image_url
    if is_permanent is not None:
        recipe.is_permanent = is_permanent
    if total_time_minutes is not None:
        recipe.total_time_minutes = total_time_minutes
    if difficulty is not None:
        recipe.difficulty = difficulty
    if food_category is not None:
        recipe.food_category = food_category
    if important_notes is not None:
        recipe.important_notes = important_notes
    if cooking_overview is not None:
        recipe.cooking_overview = cooking_overview

    db.add(recipe)
    await db.commit()
    await db.refresh(recipe, attribute_names=["ingredients", "instruction_steps"])
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


def _parse_recipe_id_list(raw_value: Optional[str]) -> List[int]:
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