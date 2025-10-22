import json
from typing import List

from ...db.database import get_db
from ...services.agent_service import AgentService
from fastapi import APIRouter, HTTPException, Body, Depends
from ..schemas.recipe import (
    GenerateRecipeRequest, ChangeRecipeAIRequest, ChangeRecipeManualRequest, ChangeStateRequest,
    AskQuestionRequest, Recipe, RecipePreview, PromptHistory, CookingSession
)
from ...utils.auth import get_read_write_user_id, get_read_only_user_id, get_user_id_optional, get_read_write_user_token_data
from ...db.crud import cooking_crud
from sqlalchemy.ext.asyncio import AsyncSession

agent_service = AgentService()

router = APIRouter(
    prefix="/cooking",
    tags=["cooking"],
    responses={404: {"description": "Not found"}},
)

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

    session = await cooking_crud.get_cooking_session_by_id(db, cooking_session_id)
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

    history = await cooking_crud.get_prompt_history_by_cooking_session_id(db, cooking_session_id)
    prompts = json.loads(history.prompts)
    responses = json.loads(history.responses)
    result = PromptHistory(prompts=prompts, responses=responses)
    return result

@router.post("/{recipe_id}/start", response_model=int)
async def start_recipe(recipe_id: int,
                       user_id: str = Depends(get_read_write_user_id),
                       db: AsyncSession = Depends(get_db)):
    """
    Start a recipe session based on the user ID and recipe details.

    Args:
        int: The recipe ID.

    Returns:
        int: The ID of the started recipe session.
    """
    cooking_session = await cooking_crud.create_cooking_session(db, user_id, recipe_id)
    return cooking_session.id

@router.put("/change_state")
async def change_state(request: ChangeStateRequest,
                       db: AsyncSession = Depends(get_db)):
    """
    Change the state of a recipe session based on the provided session ID and state details.

    Args:
        request (ChangeStateRequest): The request containing the session ID and state details.
    """

    await cooking_crud.update_cooking_session_state(db, request.cooking_session_id, request.new_state)
    return

@router.post("/ask_question", response_model=PromptHistory)
async def ask_question(request: AskQuestionRequest, user_id: str = Depends(get_read_write_user_id)):
    """
    Ask a question during a cooking session based on the provided session ID, and prompt.

    Args:
        request (AskQuestionRequest): The request containing cooking session ID, and prompt.

    Returns:
        PromptHistory: The new prompt history entry.
    """
    return agent_service.ask_question(user_id, request.cooking_session_id, request.prompt)

@router.delete("/{cooking_session_id}/finish")
async def finish_session(cooking_session_id: int,
                            db: AsyncSession = Depends(get_db)):
        """
        Finish a cooking session based on the provided session ID.
    
        Args:
            cooking_session_id (int): The ID of the cooking session to finish.
        """
    
        await cooking_crud.delete_cooking_session(db, cooking_session_id)
        return
