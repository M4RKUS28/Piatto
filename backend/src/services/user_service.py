"""
User service for handling user-related business logic (registration, profile image update, etc).
"""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..db.crud import users_crud
from ..db.models import db_user as user_model
from ..core.security import get_password_hash, verify_password
from ..core.enums import UserRole, ThemePreference

from ..db.crud import usage_crud

def get_users(db: Session, skip: int = 0, limit: int = 999):
    """Retrieve a list of users."""
    users = users_crud.get_users(db, skip=skip, limit=limit)


    extended_users = []
    for user in users:
        user.total_learn_time = usage_crud.get_total_time_spent_on_chapters(db, user.id)
        extended_users.append(user)

    return extended_users



def get_user_by_id(db: Session, user_id: str, current_user: user_model.User):
    """ Retrieve a user by their ID. """
    user = users_crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if (getattr(current_user, 'role', UserRole.USER) != UserRole.ADMIN) and str(current_user.id) != str(user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this user")
    return user


def update_user(db: Session, user_id: str, user_update, current_user: user_model.User):
    """ 
    Update a user's profile. Admins can update any user, regular users can only update their own profile. 
    user_id is the user that is being updated.
    current_user is the one who performs the update.
    user_update is the data that is being updated.
    """

    # Get the user to be updated
    db_user = users_crud.get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if the current user is authorized to update this user
    if str(db_user.id) != str(current_user.id) and getattr(current_user, 'role', UserRole.USER) != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this user")

    if str(db_user.id) != str(current_user.id) and getattr(current_user, 'role', UserRole.USER) == UserRole.ADMIN:
        # Check if admin status is being changed
        if hasattr(user_update, 'role') and db_user.role != getattr(user_update, 'role', UserRole.USER):
            if db_user.role == UserRole.ADMIN:  # User was admin, now being demoted
                usage_crud.log_demote_from_admin(db, str(current_user.id), str(db_user.id))
            elif getattr(user_update, 'role', UserRole.USER) == UserRole.ADMIN:  # User was not admin, now being promoted
                usage_crud.log_promote_to_admin(db, str(current_user.id), str(db_user.id))

    update_data = user_update.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        if str(db_user.id) == str(current_user.id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Use /change_password to update your password.")
        elif getattr(current_user, 'role', UserRole.USER) == UserRole.ADMIN:
            hashed_password = get_password_hash(update_data["password"])
            update_data["hashed_password"] = hashed_password
        del update_data["password"]
    elif "password" in update_data:
        del update_data["password"]
    if "theme" in update_data and isinstance(update_data["theme"], ThemePreference):
        update_data["theme"] = update_data["theme"].value
    if "language" in update_data and update_data["language"]:
        normalized_language = str(update_data["language"]).strip().lower()
        primary_tag = normalized_language.split("-")[0]
        update_data["language"] = primary_tag[:10]
    if getattr(current_user, 'role', UserRole.USER) != UserRole.ADMIN:
        update_data.pop("is_active", None)
        update_data.pop("role", None)
    return users_crud.update_user(db, db_user, update_data)


def change_password(db: Session, user_id: str, password_data, current_user: user_model.User):
    """ Change a user's password. """
    if str(user_id) != str(current_user.id) and getattr(current_user, 'role', UserRole.USER) != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to change this user's password")
    db_user = users_crud.get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if not password_data.new_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password not provided")
    if getattr(current_user, 'role', UserRole.USER) != UserRole.ADMIN and password_data.old_password:
        if not verify_password(password_data.old_password, db_user.hashed_password):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect old password")
    elif getattr(current_user, 'role', UserRole.USER) != UserRole.ADMIN and not password_data.old_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Old password is required")
    hashed_password = get_password_hash(password_data.new_password)
    return users_crud.change_user_password(db, db_user, hashed_password)


def delete_user(db: Session, user_id: str, current_user: user_model.User):
    """ Delete a user. Admins can delete any user, regular users can only delete their own profile. """
    if str(user_id) == str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins cannot delete themselves.")
    db_user = users_crud.get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return users_crud.delete_user(db, db_user)

