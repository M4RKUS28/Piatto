import json
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.db.models.db_recipe import CookingSession, PromptHistory


async def get_cooking_session_by_id(db: AsyncSession, cooking_session_id: int) -> Optional[CookingSession]:
    """Retrieve a cooking session by its ID."""
    result = await db.execute(select(CookingSession).filter(CookingSession.id == cooking_session_id))
    return result.scalar_one_or_none()

async def get_prompt_history_by_cooking_session_id(db: AsyncSession, cooking_session_id: int) -> Optional[PromptHistory]:
    """Retrieve the prompt history by cooking session ID."""

    # Step 1: Get the cooking session to know its current state
    result = await db.execute(select(CookingSession).where(CookingSession.id == cooking_session_id))
    cooking_session = result.scalars().first()

    if not cooking_session:
        return None

    # Step 2: Get the matching prompt history (same session and same state)
    result = await db.execute(select(PromptHistory)
        .where(
            PromptHistory.cooking_session_id == cooking_session.id,
            PromptHistory.state == cooking_session.state,
        )
    )
    prompt_history = result.scalars().first()

    if not prompt_history:
        prompt_history = PromptHistory(
            cooking_session_id=cooking_session.id,
            state=cooking_session.state,
            prompts=json.dumps([]),     # start empty
            responses=json.dumps([]),   # start empty
        )
        db.add(prompt_history)
        await db.commit()
        await db.refresh(prompt_history)  # refresh to get the assigned ID

    return prompt_history

async def update_prompt_history(db: AsyncSession,
                                prompt_history_id: int,
                                new_prompt: str,
                                new_response: str) -> Optional[PromptHistory]:
    """Update the prompt history in the database."""
    result = await db.execute(select(PromptHistory).filter(PromptHistory.id == prompt_history_id))
    prompt_history = result.scalar_one_or_none()
    if not prompt_history:
        return None
    prompt_history.prompts = json.dumps(json.loads(prompt_history.prompts) + [new_prompt])
    prompt_history.responses = json.dumps(json.loads(prompt_history.responses) + [new_response])
    db.add(prompt_history)
    await db.commit()
    await db.refresh(prompt_history)
    return prompt_history

async def create_cooking_session(db: AsyncSession,
                         user_id: str,
                         recipe_id: int) -> CookingSession:
    """Create a new cooking session in the database."""
    cooking_session = CookingSession(
        user_id=user_id,
        recipe_id=recipe_id,
        state=1,
    )
    db.add(cooking_session)
    await db.commit()
    await db.refresh(cooking_session)
    return cooking_session

async def update_cooking_session_state(db: AsyncSession,
                               cooking_session_id: int,
                               new_state: int) -> Optional[CookingSession]:
    """Update the state of an existing cooking session in the database."""
    result = await db.execute(select(CookingSession).filter(CookingSession.id == cooking_session_id))
    cooking_session = result.scalar_one_or_none()
    if not cooking_session:
        return None
    cooking_session.state = new_state
    db.add(cooking_session)
    await db.commit()
    await db.refresh(cooking_session)
    return cooking_session

async def delete_cooking_session(db: AsyncSession,
                               cooking_session_id: int) -> bool:
    """Delete a cooking session from the database."""
    result = await db.execute(select(CookingSession).filter(CookingSession.id == cooking_session_id))
    cooking_session = result.scalar_one_or_none()
    if not cooking_session:
        return False
    await db.delete(cooking_session)
    await db.commit()
    return True