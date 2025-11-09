from pydantic import BaseModel
from typing import Any, Optional, Literal

class APIResponseStatus(BaseModel):
    """Base model for API responses."""
    status: Literal["success", "error"]
    msg: str
    data: Optional[Any] = None

class VoiceTokenResponse(BaseModel):
    """Model for voice token response."""
    voice_token: str
    expires_in: int  # Expiration time in seconds
    user_id: str
