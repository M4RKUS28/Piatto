"""
Chat service for handling chat interactions with AI agents.

This service coordinates the interaction between the API and the chat agent,
handling message processing, streaming responses, and error handling.
"""
#import asyncio
import json
import logging
from typing import AsyncGenerator#, Optional

from fastapi import HTTPException
#from google.adk.sessions import DatabaseSessionService
#from google.genai import types
#from sqlalchemy import create_engine
#from sqlalchemy.ext.asyncio import AsyncSession


#from ..config import settings
#from ..agents.chat_agent.agent import ChatAgent
#from ..agents.utils import create_text_query
#from ..api.schemas.chat import ChatRequest

#from ..db.database import get_async_db_context, get_db_context
from ..db.models.db_recipe import CookingSession


logger = logging.getLogger(__name__)

class ChatService:
    """Service for handling chat interactions with AI agents."""

    async def process_chat_message(
        self,
        user_id: str,
        cooking_session: CookingSession,
        request: ChatRequest
    ) -> AsyncGenerator[str, None]:
        
        
        try:
  
            yield "event: \n\n"
        except HTTPException:
            raise
        except Exception as e:
            # Send an error message as an SSE event
            error_msg = json.dumps({"error": "An error occurred while processing your message"})
            yield f"event: error\ndata: {error_msg}\n\n"
            # Re-raise the exception to be handled by the endpoint
            raise HTTPException(
                status_code=500,
                detail="An error occurred while processing your message"
            ) from e
        


chat_service = ChatService()
