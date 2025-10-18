"""Chat API endpoints for interacting with the AI chat agent."""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from pydantic import constr
from sqlalchemy.orm import Session

from ...db.database import get_db
from ...db.models.db_user import User
from ...db.database import get_async_db_context


from ...utils.auth import get_read_write_user_id
from ..schemas.chat import ChatRequest, ChatResponse
from ...services.chat_service import chat_service
from ...db.crud import cooking_crud


logger = logging.getLogger(__name__)

# Maximum message length to prevent abuse
MAX_MESSAGE_LENGTH = 2000
MAX_CHAT_USAGE = 1000  # Example limit, can be made dynamic



router = APIRouter(
    prefix="/chat",
    tags=["chat"],
    responses={
        404: {"description": "Not found"},
        429: {"description": "Too Many Requests"},
        500: {"description": "Internal Server Error"},
    },
)

def _validate_chat_request(chat_request: ChatRequest) -> None:
    """Validate the chat request parameters.
    
    Args:
        chat_request: The chat request to validate
        
    Raises:
        HTTPException: If validation fails
    """
    if not chat_request.message or not chat_request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty"
        )
    
    if len(chat_request.message) > MAX_MESSAGE_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Message too long. Max {MAX_MESSAGE_LENGTH} characters allowed."
        )


@router.post(
    "/{chapter_id}",
    response_model=None,
    responses={
        200: {
            "description": "Successful Response",
            "content": {"text/event-stream": {}}
        },
        400: {"description": "Bad Request - Invalid input"},
        401: {"description": "Unauthorized - Authentication required"},
        403: {"description": "Forbidden - Insufficient permissions"},
        429: {"description": "Too Many Requests - Rate limit exceeded"},
        500: {"description": "Internal Server Error"},
    }
)
async def chat_with_agent(
    cooking_session_id: int,
    chat_request: ChatRequest,
    current_user_id: str = Depends(get_read_write_user_id)
) -> StreamingResponse:

    # Validate the request
    _validate_chat_request(chat_request)

    try:
        # Fetch cooking session
        cooking_session = None
        async with get_async_db_context() as db:
            cooking_session = cooking_crud.get_cooking_session_by_id(
                db, cooking_session_id
            )
        if not cooking_session:
            raise HTTPException(status_code=404, detail="Cooking session not found")

                
        # Process the chat message and return a streaming response
        return StreamingResponse(
            chat_service.process_chat_message(
                user_id=str(current_user_id),
                cooking_session=cooking_session,
                request=chat_request,
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
        
    except HTTPException as e:
        # Re-raise HTTP exceptions (like validation errors)
        raise e
    except Exception as e:
        # Log unexpected errors
        logger.error(
            "Unexpected error in chat_with_agent",
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing your request"
        ) from e
