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
from ...db.crud import recipe_crud, preparing_crud
from sqlalchemy.ext.asyncio import AsyncSession

agent_service = AgentService()

router = APIRouter(
    prefix="/preparing",
    tags=["preparing"],
    responses={404: {"description": "Not found"}},
)

@router.post("/generate", response_model=int)
async def generate_recipe(request: GenerateRecipeRequest, user_id: str = Depends(get_read_write_user_id)):
    """
    Generate a recipe based on the user ID, prompt, and optional preparing session ID.

    Args:
        request (GenerateRecipeRequest): The request containing prompt, written_ingredients, image_key, and optional preparing session ID.

    Returns:
        int: A preparing session ID containing the generated recipe.
    """
    return await agent_service.generate_recipe(
        user_id, 
        request.prompt, 
        request.written_ingredients, 
        preparing_session_id=request.preparing_session_id,
        image_key=request.image_key
    )

@router.get("/{preparing_session_id}/get_options", response_model=List[RecipePreview])
async def get_recipe_options(preparing_session_id: int,
                      db: AsyncSession = Depends(get_db)):
    """
    Get available recipe options based on the provided preparing session ID.

    Args:
        preparing_session_id (int): The id of the current preparation session.

    Returns:
        List[RecipePreview]: A list of recipe previews.
    """

    recipes = await recipe_crud.get_recipes_by_preparing_session_id(db, preparing_session_id)
    if not recipes:
        raise HTTPException(status_code=404, detail="No recipes found for the given preparing session ID")
    result = []
    for recipe in recipes:
        result.append(RecipePreview(
            id=recipe.id,
            title=recipe.title,
            description=recipe.description,
            image_url=recipe.image_url,
        ))
    return result

@router.delete("/{preparing_session_id}/finish")
async def finish_session(preparing_session_id: int,
                        db: AsyncSession = Depends(get_db)):
        """
        Finish a preparing session based on the provided session ID.
    
        Args:
            preparing_session_id (int): The ID of the preparing session.
    
        Returns:
            dict: A confirmation message.
        """
    
        await preparing_crud.delete_preparing_session(db, preparing_session_id)
        return