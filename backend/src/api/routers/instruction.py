from typing import List

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from ...db.database import get_db
from ...services.agent_service import AgentService
from ...utils.auth import get_read_write_user_id, get_read_only_user_id
from ...db.crud import instruction_crud
from ..schemas.recipe import Instruction as InstructionSchema


agent_service = AgentService()

router = APIRouter(
    prefix="/instruction",
    tags=["instruction"],
    responses={404: {"description": "Not found"}},
)


class GenerateInstructionRequest(BaseModel):
    """Schema for generating instructions for a recipe."""
    preparing_session_id: int
    recipe_id: int


@router.post("/generate", response_model=int)
async def generate_instructions(
    request: GenerateInstructionRequest,
    user_id: str = Depends(get_read_write_user_id)
):
    """
    Generate instructions for a recipe using AI.

    Args:
        request: The request containing preparing_session_id and recipe_id
        user_id: The authenticated user ID

    Returns:
        int: The recipe ID
    """
    recipe_id = await agent_service.generate_instruction(
        user_id=user_id,
        preparing_session_id=request.preparing_session_id,
        recipe_id=request.recipe_id
    )
    return recipe_id


@router.get("/{recipe_id}", response_model=List[InstructionSchema])
async def get_instructions(
    recipe_id: int,
    user_id: str = Depends(get_read_only_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all instruction steps for a recipe.

    Args:
        recipe_id: The ID of the recipe
        user_id: The authenticated user ID
        db: Database session

    Returns:
        List[InstructionSchema]: List of instruction steps
    """
    instruction_steps = await instruction_crud.get_instructions_by_recipe_id(db, recipe_id, user_id=user_id)

    if not instruction_steps:
        raise HTTPException(status_code=404, detail="No instructions found for this recipe")
    


    return [
        InstructionSchema(
            id=step.id,
            heading=step.heading,
            description=step.description,
            animation=step.animation,
            timer=step.timer,
        )
        for step in instruction_steps
    ]


@router.delete("/{recipe_id}")
async def delete_instructions(
    recipe_id: int,
    user_id: str = Depends(get_read_write_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete all instruction steps for a recipe.

    Args:
        recipe_id: The ID of the recipe
        user_id: The authenticated user ID
        db: Database session

    Returns:
        dict: Success message
    """
    success = await instruction_crud.delete_instruction_steps(db, recipe_id, user_id=user_id)

    if not success:
        raise HTTPException(status_code=404, detail="Recipe not found")

    return {"message": "Instructions deleted successfully"}