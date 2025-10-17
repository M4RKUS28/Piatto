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

@router.put("/change_ai", response_model=Recipe) # TODO
async def change_recipe_ai(request: ChangeRecipeAIRequest, user_id: str = Depends(get_read_write_user_id)):
    """
    Modify a recipe using AI based on the user ID, change prompt, and recipe ID.

    Args:
        request (ChangeRecipeAIRequest): The request containing change prompt, and recipe ID.

    Returns:
        Recipe: The modified recipe.
    """
    return await agent_service.change_recipe(user_id, request.change_prompt, request.recipe_id)

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
    # DB: Update the old recipe
    ingredients=json.dumps([ingredient.dict() for ingredient in request.ingredients]) if request.ingredients is not None else None,
    await recipe_crud.update_recipe(request.recipe_id,
                                    title=request.title,
                                    description=request.description,
                                    ingredients=ingredients,

@router.post("/{recipe_id}/save")
async def save_recipe(recipe_id: int):
    """
    Save a recipe based on the provided recipe ID.

    Args:
        int: The recipe ID.
    """
    # DB: Mark the recipe as permanent
    pass

@router.post("/{recipe_id}/start", response_model=int)
async def start_recipe(recipe_id: int):
    """
    Start a recipe session based on the user ID and recipe details.

    Args:
        int: The recipe ID.

    Returns:
        int: The ID of the started recipe session.
    """
    # DB: Create a new cooking session
    pass

@router.put("/change_state")
async def change_state(request: ChangeStateRequest,
                       db: AsyncSession = Depends(get_db)):
    """
    Change the state of a recipe session based on the provided session ID and state details.

    Args:
        request (ChangeStateRequest): The request containing the session ID and state details.
    """

    await recipe_crud.update_cooking_session_state(db, request.cooking_session_id, request.new_state)
    return

@router.post("/ask_question", response_model=int) # TODO
async def ask_question(request: AskQuestionRequest, user_id: str = Depends(get_read_write_user_id)):
    """
    Ask a question during a cooking session based on the provided session ID, and prompt.

    Args:
        request (AskQuestionRequest): The request containing cooking session ID, and prompt.

    Returns:
        int: The ID of the prompt history entry.
    """
    prompt_history_id = 1
    # DB: Get the prompt history id
    return agent_service.ask_question(user_id, request.cooking_session_id, request.prompt, prompt_history_id)

@router.get("/{gen_context_id}/get_options", response_model=List[RecipePreview])
async def get_options(gen_context_id: int,
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

@router.get("/{recipe_id}/get_recipe", response_model=Recipe)
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

@router.get("/{cooking_session_id}/get_session", response_model=CookingSession)
async def get_session(cooking_session_id: int,
                      db: AsyncSession = Depends(get_db)):
    """
    Retrieve a cooking session based on the provided session ID.

    Args:
        cooking_session_id (int): The ID of the cooking session.

    Returns:
        CookingSession: The corresponding cooking session.
    """

    session = await recipe_crud.get_cooking_session_by_id(db, cooking_session_id)
    result = CookingSession(
        id=session.id,
        recipe_id=session.recipe_id,
        state=session.state
    )
    return result

@router.get("{cooking_session_id}/get_prompt_history", response_model=PromptHistory)
async def get_prompt_history(cooking_session_id: int,
                            db: AsyncSession = Depends(get_db)
):
    """
    Retrieve the prompt history based on the provided cooking session ID.

    Args:
        cooking_session_id (int): The ID of the cooking session that includes the current state.

    Returns:
        PromptHistory: The prompt history.
    """

    history = await recipe_crud.get_prompt_history_by_cooking_session_id(db, cooking_session_id)
    prompts = json.loads(history.prompts)
    responses = json.loads(history.responses)
    result = PromptHistory(prompts=prompts, responses=responses)
    return result