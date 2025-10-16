"""Admin-only API endpoints."""
from __future__ import annotations

import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...db.database import get_db
from ...db.models import db_user as user_model
from ...services import settings_service, restart_service
from ...utils import auth
from ..schemas import settings as settings_schema
from ...config import settings as config_settings


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    responses={404: {"description": "Not found"}},
)



@router.get(
    "/dynamic-settings",
    response_model=settings_schema.DynamicSettingsResponse,
)
async def get_dynamic_settings(
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(auth.get_current_admin_user),
) -> settings_schema.DynamicSettingsResponse:
    """Return all dynamic application settings with metadata."""

    logger.debug("Admin %s requested dynamic settings", getattr(current_user, "id", None))
    settings = settings_service.list_dynamic_settings(db)
    return settings_schema.DynamicSettingsResponse(settings=settings)


@router.post(
    "/dynamic-settings",
    response_model=settings_schema.DynamicSettingsResponse,
    status_code=status.HTTP_200_OK,
)
async def update_dynamic_settings(
    payload: settings_schema.UpdateDynamicSettingsRequest,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(auth.get_current_admin_user),
) -> settings_schema.DynamicSettingsResponse:
    """Update one or more dynamic settings."""

    if not payload.updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one setting update must be provided",
        )

    keys = [update.key for update in payload.updates]
    if len(keys) != len(set(keys)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate setting keys are not allowed",
        )

    updates: Dict[str, object] = {update.key: update.value for update in payload.updates}

    logger.info(
        "Admin %s updating dynamic settings: %s",
        getattr(current_user, "id", None),
        ", ".join(keys),
    )

    updated_settings = settings_service.update_dynamic_settings(db, updates)
    return settings_schema.DynamicSettingsResponse(settings=updated_settings)
