import os
import tempfile
from typing import List

from ...db.database import get_db
from ...services.agent_service import AgentService
from fastapi import APIRouter, File, HTTPException, Depends, UploadFile
from ..schemas.recipe import GenerateRecipeRequest, RecipePreview
from ...utils.auth import get_read_write_user_id, get_read_only_user_id
from ...db.crud import recipe_crud, preparing_crud
from sqlalchemy.ext.asyncio import AsyncSession
from ...services.agent_service import AgentService

agent_service = AgentService()

router = APIRouter(
    prefix="/preparing",
    tags=["preparing"],
    responses={404: {"description": "Not found"}},
)

@router.post("/generate", response_model=int)
async def generate_recipes(request: GenerateRecipeRequest, user_id: str = Depends(get_read_write_user_id)):
    """
    Generate a recipes based on the user ID, prompt, and optional preparing session ID.

    Args:
        request (GenerateRecipeRequest): The request containing prompt, written_ingredients, image_key, and optional preparing session ID.

    Returns:
        int: A preparing session ID containing the generated recipe.
    """
    return await agent_service.generate_recipe(
        user_id,
        request.prompt,
        request.written_ingredients,
        preparing_session_id=request.preparing_session_id
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
    print("!!! Hello from get_recipe_options !!!")
    recipes = await recipe_crud.get_recipe_previews_by_preparing_session_id(db, preparing_session_id)
    if recipes is None:
        raise HTTPException(status_code=404, detail="Preparing session not found")

    result = []
    for recipe in recipes:
        result.append(RecipePreview(
            id=recipe.id,
            title=recipe.title,
            description=recipe.description,
        ))
    return result

@router.delete("/{preparing_session_id}/finish")
async def finish_session(preparing_session_id: int, db: AsyncSession = Depends(get_db)):
    """
    Finish a preparing session based on the provided session ID.

    Args:
        preparing_session_id (int): The ID of the preparing session.

    Returns:
        dict: A confirmation message.
    """

    await preparing_crud.delete_preparing_session(db, preparing_session_id)
    return


@router.post("/image-analysis")
async def get_image_analysis_by_session_id(file: UploadFile = File(...),
                                             user_id: str = Depends(get_read_only_user_id)):
    """Analyze an uploaded image for ingredients and associate the analysis with a preparing session."""
    
    body = await file.read()
    analysis = await agent_service.analyze_ingredients(user_id, body)
    if analysis is None:
        raise HTTPException(status_code=404, detail="Preparing session not found")
    return analysis


@router.delete("/{preparing_session_id}/current-recipes/{recipe_id}")
async def remove_current_recipe(
    preparing_session_id: int,
    recipe_id: int,
    user_id: str = Depends(get_read_write_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Remove a recipe from the active list for the session."""
    try:
        updated_ids = await preparing_crud.remove_recipe_from_current(db, preparing_session_id, user_id, recipe_id)
    except PermissionError:
        raise HTTPException(status_code=403, detail="Preparing session does not belong to the authenticated user") from None

    if updated_ids is None:
        raise HTTPException(status_code=404, detail="Preparing session not found")

    return {"current_recipes": updated_ids}


@router.post("/{preparing_session_id}/current-recipes/{recipe_id}")
async def add_current_recipe(
    preparing_session_id: int,
    recipe_id: int,
    user_id: str = Depends(get_read_write_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Re-add a recipe to the active list for the session."""
    try:
        updated_ids = await preparing_crud.add_recipe_to_current(db, preparing_session_id, user_id, recipe_id)
    except PermissionError:
        raise HTTPException(status_code=403, detail="Preparing session does not belong to the authenticated user") from None

    if updated_ids is None:
        raise HTTPException(status_code=404, detail="Preparing session not found")

    return {"current_recipes": updated_ids}