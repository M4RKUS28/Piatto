import json
from typing import List

from ...db.database import get_db
from ...services.agent_service import AgentService
from fastapi import APIRouter, HTTPException, Body, Depends
from ..schemas.recipe import (
    GenerateRecipeRequest, ChangeRecipeAIRequest, ChangeRecipeManualRequest, ChangeStateRequest,
    AskQuestionRequest, Recipe, RecipePreview, PromptHistory, CookingSession
)
from ...utils.auth import get_read_write_user_id, get_readonly_user_id, get_user_id_optional, get_read_write_user_token_data
from ...db.crud import recipe_crud
from sqlalchemy.ext.asyncio import AsyncSession


agent_service = AgentService()

router = APIRouter(
    prefix="/recipe",
    tags=["recipe"],
    responses={404: {"description": "Not found"}},
)


@router.get("/{recipe_id}/get", response_model=Recipe)
async def get_recipe(recipe_id: int,
                     db : AsyncSession = Depends(get_db)):
    """
    Retrieve a recipe based on the provided recipe ID.

    Args:
        recipe_id (int): The ID of the recipe to retrieve.

    Returns:
        Recipe: The retrieved recipe.
    """

    recipe = await recipe_crud.get_recipe_by_id(db, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    result = Recipe(
        id=recipe.id,
        title=recipe.title,
        description=recipe.description,
        ingredients=json.loads(recipe.ingredients),
        instructions=json.loads(recipe.instructions),
        image_url=recipe.image_url,
    )
    return result

@router.post("/get_all", response_model=List[Recipe])
async def get_all_recipes(user_id: str = Depends(get_readonly_user_id),
                          db : AsyncSession = Depends(get_db)):
    """
    Retrieve all recipes for a given user ID.

    Args:
        user_id (str): The user ID to retrieve recipes for.
    Returns:
        List[Recipe]: A list of retrieved recipes.
    """
    recipes = await recipe_crud.get_all_recipes_by_user_id(db, user_id)
    result = []
    for recipe in recipes:
        result.append(Recipe(
            id=recipe.id,
            title=recipe.title,
            description=recipe.description,
            ingredients=json.loads(recipe.ingredients),
            instructions=json.loads(recipe.instructions),
            image_url=recipe.image_url,
        ))
    return result
                      



@router.put("/change_ai", response_model=Recipe)
async def change_recipe_ai(request: ChangeRecipeAIRequest):
    """
    Modify a recipe using AI based on the user ID, change prompt, and recipe ID.

    Args:
        request (ChangeRecipeAIRequest): The request containing change prompt, and recipe ID.

    Returns:
        Recipe: The modified recipe.
    """
    return await agent_service.change_recipe(request.change_prompt, request.recipe_id)

@router.put("/change_manual", response_model=Recipe)
async def change_recipe_manual(request: ChangeRecipeManualRequest,
                               db: AsyncSession = Depends(get_db)):
    """
    Modify a recipe manually based on the user ID, recipe ID and new recipe.

    Args:
        request (ChangeRecipeManualRequest): The request containing recipe ID and new recipe details.

    Returns:
        Recipe: The modified recipe.
    """
    recipe = await recipe_crud.update_recipe(
        db,
        recipe_id=request.recipe_id,
        title=request.title,
        description=request.description,
        ingredients=json.dumps(request.ingredients),
        instructions=json.dumps(request.instructions),
        image_url=request.image_url,
    )
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    result = Recipe(
        id=recipe.id,
        title=recipe.title,
        description=recipe.description,
        ingredients=json.loads(recipe.ingredients),
        instructions=json.loads(recipe.instructions),
        image_url=recipe.image_url,
    )
    return result

@router.post("/{recipe_id}/save")
async def save_recipe(recipe_id: int,
                      db: AsyncSession = Depends(get_db)):
    """
    Save a recipe based on the provided recipe ID.

    Args:
        int: The recipe ID.
    """

    await recipe_crud.update_recipe(db, recipe_id, is_permanent=True)
    return

@router.delete("/{recipe_id}/delete")
async def delete_recipe(recipe_id: int,
                        db: AsyncSession = Depends(get_db)):
    """
    Delete a recipe based on the provided recipe ID.

    Args:
        recipe_id (int): The ID of the recipe to delete.
    """

    await recipe_crud.delete_recipe(db, recipe_id)
    return