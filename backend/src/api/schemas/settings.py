"""Pydantic models for admin dynamic settings endpoints."""
from __future__ import annotations

from datetime import datetime
from typing import Any, List

from pydantic import BaseModel, ConfigDict


class DynamicSetting(BaseModel):
    """Single dynamic application setting with metadata."""

    key: str
    value: Any
    default_value: Any
    value_type: str
    description: str | None = None
    category: str = "general"
    created_at: datetime | None = None
    updated_at: datetime | None = None


    model_config = ConfigDict(populate_by_name=True)


class DynamicSettingsResponse(BaseModel):
    """Response wrapper for listing dynamic settings."""

    settings: List[DynamicSetting]


class DynamicSettingUpdate(BaseModel):
    """Payload describing a single dynamic setting update."""

    key: str
    value: Any

    model_config = ConfigDict(extra="forbid")


class UpdateDynamicSettingsRequest(BaseModel):
    """Request payload carrying multiple dynamic setting updates."""

    updates: List[DynamicSettingUpdate]

    model_config = ConfigDict(extra="forbid")
