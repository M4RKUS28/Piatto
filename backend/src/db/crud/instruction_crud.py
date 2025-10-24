from typing import List, Optional
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.db_recipe import InstructionStep


async def get_instructions_by_recipe_id(db: AsyncSession, recipe_id: int) -> List[InstructionStep]:
    """Retrieve all instruction steps for a recipe, ordered by step_number."""
    result = await db.execute(
        select(InstructionStep)
        .filter(InstructionStep.recipe_id == recipe_id)
        .order_by(InstructionStep.step_number)
    )
    return result.scalars().all()


async def create_instruction_steps(
    db: AsyncSession,
    recipe_id: int,
    steps: List[dict]
) -> List[InstructionStep]:
    """
    Create multiple instruction steps for a recipe.

    Args:
        db: Database session
        recipe_id: ID of the recipe
        steps: List of step dictionaries with keys: heading, description, animation, timer

    Returns:
        List of created InstructionStep objects
    """
    # Delete existing instructions for this recipe
    await db.execute(
        delete(InstructionStep).where(InstructionStep.recipe_id == recipe_id)
    )

    instruction_steps = []
    for idx, step_data in enumerate(steps):
        instruction_step = InstructionStep(
            recipe_id=recipe_id,
            step_number=idx,
            heading=step_data.get("heading"),
            description=step_data.get("description"),
            animation=step_data.get("animation"),
            timer=step_data.get("timer"),
        )
        db.add(instruction_step)
        instruction_steps.append(instruction_step)

    await db.commit()

    # Refresh to get IDs
    for step in instruction_steps:
        await db.refresh(step)

    return instruction_steps


async def update_instruction_steps(
    db: AsyncSession,
    recipe_id: int,
    steps: List[dict]
) -> List[InstructionStep]:
    """
    Update instruction steps for a recipe (replaces all existing steps).

    Args:
        db: Database session
        recipe_id: ID of the recipe
        steps: List of step dictionaries with keys: heading, description, animation, timer

    Returns:
        List of updated InstructionStep objects
    """
    # This is the same as create since we replace all steps
    return await create_instruction_steps(db, recipe_id, steps)


async def delete_instruction_steps(db: AsyncSession, recipe_id: int) -> bool:
    """Delete all instruction steps for a recipe."""
    await db.execute(
        delete(InstructionStep).where(InstructionStep.recipe_id == recipe_id)
    )
    await db.commit()
    return True