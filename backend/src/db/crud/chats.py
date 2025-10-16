
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from ..models.db_chat import Chat



async def get_last_n_messages_by_course_id(db: AsyncSession, course_id: int, n: int = 10) -> List[Chat]:
    """Get the last n messages for a given course by its ID"""
    result = await db.execute(
        select(Chat)
        .filter(Chat.course_id == course_id)
        .order_by(Chat.created_at.desc())
        .limit(n)
    )
    return result.scalars().all()

async def save_chat_message(db: AsyncSession, chat: Chat) -> Chat:
    """Save a chat message to the database"""
    db.add(chat)
    await db.commit()
    await db.refresh(chat)
    return chat