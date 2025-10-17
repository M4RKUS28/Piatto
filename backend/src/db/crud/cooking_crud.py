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

    #TODO Create new prompt history if not exists

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
        .order_by(PromptHistory.created_at.desc())  # optional: in case multiple entries exist
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
