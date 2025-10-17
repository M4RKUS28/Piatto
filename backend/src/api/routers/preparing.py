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
    prefix="/preparing",
    tags=["preparing"],
    responses={404: {"description": "Not found"}},
)

@router.post("/generate", response_model=int) # TODO
async def generate_recipe(request: GenerateRecipeRequest, user_id: str = Depends(get_read_write_user_id)):
    """
    Generate a recipe based on the user ID, prompt, and optional generation context ID.

    Args:
        request (GenerateRecipeRequest): The request containing prompt, and optional generation context ID.

    Returns:
        int: A generation context ID (The one given as an argument if available).
    """
    gen_context_id = request.gen_context_id if request.gen_context_id is not None else 0
    return await agent_service.generate_recipe(user_id, request.prompt, gen_context_id)

@router.get("/{gen_context_id}/get_options", response_model=List[RecipePreview])
async def get_recipe_options(gen_context_id: int,
                      db: AsyncSession = Depends(get_db)):
    """
    Get available recipe options based on the provided context ID.

    Args:
        gen_context_id (int): The context ID of the generated recipes.

    Returns:
        List[RecipePreview]: A list of recipe previews.
    """

    recipes = await recipe_crud.get_recipes_by_gen_context_id(db, gen_context_id)
    if not recipes:
        raise HTTPException(status_code=404, detail="No recipes found for the given generation context ID")
    result = []
    for recipe in recipes:
        result.append(RecipePreview(
            id=recipe.id,
            title=recipe.title,
            description=recipe.description,
            image_url=recipe.image_url,
        ))
    return result

