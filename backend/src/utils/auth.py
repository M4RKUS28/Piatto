from typing import Any, Dict, Optional, Set, Tuple
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel


# Import the SQLAlchemy User model module correctly
from ..db.models import db_user as user_model
# Import Pydantic schemas (only TokenData is directly used here)
from ..db.database import get_db
# Import security utilities
from ..core import security, enums
from ..core.enums import AccessLevel
from ..core.security import get_access_token_from_cookie
# Import settings

from ..db.crud.users_crud import get_active_user_by_id
# from fastapi import Request # Added Request for get_optional_current_user



READ_ACCESS_LEVELS: Set[AccessLevel] = {
    AccessLevel.READ_ONLY,
    AccessLevel.READ_WRITE,
}
WRITE_ACCESS_LEVELS: Set[AccessLevel] = {
    AccessLevel.WRITE_ONLY,
    AccessLevel.READ_WRITE,
}



class TokenData(BaseModel):
    """Schema for the token data."""
    username: Optional[str] = None
    user_id: Optional[str] = None
    email: Optional[str] = None # Added email
    role: Optional[enums.UserRole] = None


def authenticate_user(db: Session, username: str, password: str) -> Optional[user_model.User]:
    """Authenticate a user by username and password."""
    authenticated_db_user = db.query(user_model.User).filter(user_model.User.username == username).first()
    if not authenticated_db_user:
        return None
    if not security.verify_password(password, authenticated_db_user.hashed_password):
        return None
    return authenticated_db_user # Return the SQLAlchemy user model instance


def _resolve_user_from_token(
    access_token: Optional[str],
    db: Session,
) -> Tuple[user_model.User, Dict[str, Any]]:
    """Validate the access token and return the active user with its payload."""

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated: Access token missing",
        )

    payload = security.verify_token(access_token)
    user_id = payload.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing required claims",
        )

    user = get_active_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    return user, payload


def _ensure_access_level(payload: Dict[str, Any], allowed_levels: Set[AccessLevel]) -> None:
    raw_value = payload.get("access_level")
    try:
        access_level = AccessLevel(raw_value)
    except (ValueError, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have the required access level",
        ) from exc

    if access_level not in allowed_levels:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have the required access level",
        )


async def get_current_active_write_user(
    access_token: Optional[str] = Depends(get_access_token_from_cookie),
    db: Session = Depends(get_db),
) -> user_model.User:
    """Return the current active user with write permissions (requires access_level='rw')."""

    user, payload = _resolve_user_from_token(access_token, db)
    _ensure_access_level(payload, WRITE_ACCESS_LEVELS)
    return user


async def get_current_active_user(
    access_token: Optional[str] = Depends(get_access_token_from_cookie),
    db: Session = Depends(get_db),
) -> user_model.User:
    """Backward-compatible alias for write-enabled user retrieval."""

    return await get_current_active_write_user(access_token, db)


async def get_current_active_read_user(
    access_token: Optional[str] = Depends(get_access_token_from_cookie),
    db: Session = Depends(get_db),
) -> user_model.User:
    """Return the current active user with read permissions."""

    user, payload = _resolve_user_from_token(access_token, db)
    _ensure_access_level(payload, READ_ACCESS_LEVELS)
    return user


async def get_current_user_optional(access_token: Optional[str] = Depends(get_access_token_from_cookie),
                                           db: Session = Depends(get_db)) -> Optional[user_model.User]:
    """
    Get the current user based on the provided token.
    Returns None if the user is not authenticated or not found.
    This is useful for endpoints where the user may not be required to be logged in.
    """
    if not access_token:
        return None  # No token means no user, which is acceptable in this context

    # Verify the token and extract user ID
    payload = security.verify_token(access_token)
    user_id = payload.get("user_id")
    if user_id is None:
        return None

    user = get_active_user_by_id(db, user_id)
    return user # if user else None

async def get_current_admin_user(current_db_user: user_model.User = Depends(get_current_active_write_user)) -> user_model.User:
    """Ensure the current user is an admin."""
     # Check if the user is an admin
     # If not, raise a 403 Forbidden error
    if not bool(current_db_user.role == enums.UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_db_user

