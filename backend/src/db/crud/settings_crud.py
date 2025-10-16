"""CRUD helpers for application settings stored in the database."""
from __future__ import annotations

from typing import Dict, Iterable, List, cast

from sqlalchemy.orm import Session

from ...db.models.db_app_setting import AppSetting


def get_all_settings(db: Session) -> List[AppSetting]:
    """Return all persisted settings."""

    return db.query(AppSetting).all()


def get_settings_by_keys(db: Session, keys: Iterable[str]) -> Dict[str, AppSetting]:
    """Fetch settings whose keys are in *keys* and return keyed by the setting name."""

    key_list = list(keys)
    if not key_list:
        return {}

    rows = db.query(AppSetting).filter(AppSetting.key.in_(key_list)).all()

    result: Dict[str, AppSetting] = {}
    for setting in rows:
        if setting.key is None:  # Defensive guard for partially persisted rows
            continue
        key_value = cast(str, setting.key)
        result[key_value] = setting
    return result


def create_setting(
    db: Session,
    *,
    key: str,
    value: str,
    value_type: str,
    default_value: str | None = None,
    description: str | None = None,
    category: str | None = None,
) -> AppSetting:
    """Persist a new setting row."""

    setting = AppSetting(
        key=key,
        value=value,
        value_type=value_type,
        default_value=default_value,
        description=description,
        category=category or "general",
    )
    db.add(setting)
    return setting


def sync_setting_metadata(
    db: Session,
    *,
    key: str,
    value_type: str,
    default_value: str | None,
    description: str | None,
    category: str | None,
) -> bool:
    """Ensure the metadata for an existing setting matches the provided definition."""

    setting = db.query(AppSetting).filter(AppSetting.key == key).one_or_none()
    if not setting:
        return False

    was_updated = False
    if setting.value_type != value_type:
        setting.value_type = value_type
        was_updated = True
    if default_value is not None and setting.default_value != default_value:
        setting.default_value = default_value
        was_updated = True
    if description is not None and setting.description != description:
        setting.description = description
        was_updated = True
    if category is not None and setting.category != category:
        setting.category = category
        was_updated = True

    return was_updated
