"""Service layer for database-backed application settings."""
from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime, timedelta, timezone
from threading import RLock
from typing import Any, Dict, List, Tuple, cast

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..config.dynamic_settings import DYNAMIC_SETTINGS_REGISTRY, DynamicSettingDefinition
from ..db.crud import settings_crud
from ..db.database import get_db_context_with_rollback
from ..db.models.db_app_setting import AppSetting





logger = logging.getLogger(__name__)

class DynamicSettingsCache:
    """Cache and loader for dynamic application settings."""

    def __init__(
        self,
        definitions: Dict[str, DynamicSettingDefinition],
        *,
        min_refresh_interval: timedelta = timedelta(minutes=1),
    ) -> None:
        self._definitions = definitions
        self._lock = RLock()
        self._min_refresh_interval = min_refresh_interval
        self._cache: Dict[str, Any] = {
            key: definition.default for key, definition in definitions.items()
        }
        self._raw_cache: Dict[str, str] = {}
        self._fingerprint: str | None = None
        self._last_loaded: datetime = datetime.fromtimestamp(0, tz=timezone.utc)

    def get(self, key: str) -> Any:
        """Return the current cached value for *key*, falling back to the defined default."""

        definition = self._definitions.get(key)
        if not definition:
            raise KeyError(f"Unknown dynamic setting: {key}")

        sentinel = object()
        with self._lock:
            value = self._cache.get(key, sentinel)
            fingerprint = self._fingerprint

        if value is sentinel or fingerprint is None:
            self.refresh()
            with self._lock:
                value = self._cache.get(key, sentinel)

        if value is sentinel or value is None:
            return definition.default
        return value

    def get_int(self, key: str) -> int:
        value = self.get(key)
        if value is None:
            definition_default = self._definitions[key].default
            if definition_default is None:
                raise ValueError(f"Dynamic setting '{key}' is None and has no default")
            return int(definition_default)
        return int(value)

    def get_bool(self, key: str) -> bool:
        value = self.get(key)
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.lower() in {"1", "true", "yes", "on"}
        if value is None:
            definition_default = self._definitions[key].default
            return bool(definition_default)
        return bool(value)

    def get_all(self) -> Dict[str, Any]:
        with self._lock:
            return dict(self._cache)

    def refresh(self, *, force: bool = False) -> Dict[str, Tuple[Any | None, Any | None]]:
        """Refresh cached settings from the database.

        Returns a mapping of keys that changed to a tuple (old_value, new_value).
        """

        now = datetime.now(timezone.utc)
        with self._lock:
            if (
                not force
                and self._cache
                and now - self._last_loaded < self._min_refresh_interval
            ):
                return {}

        with get_db_context_with_rollback() as db:
            new_cache, raw_cache, fingerprint = self._load_from_db(db)

        with self._lock:
            changes = self._diff(self._cache, new_cache)
            self._cache = new_cache
            self._raw_cache = raw_cache
            self._fingerprint = fingerprint
            self._last_loaded = now
            return changes

    def ensure_loaded(self) -> None:
        """Load settings if the cache hasn't been populated yet."""

        with self._lock:
            needs_initial_load = not self._cache or self._fingerprint is None
        if needs_initial_load:
            self.refresh(force=True)

    def _load_from_db(
        self, db: Session
    ) -> Tuple[Dict[str, Any], Dict[str, str], str]:  # pragma: no cover - DB interaction
        definitions = self._definitions
        existing_map = settings_crud.get_settings_by_keys(db, definitions.keys())

        for definition in definitions.values():
            if definition.key not in existing_map:
                settings_crud.create_setting(
                    db,
                    key=definition.key,
                    value=definition.serialize(definition.default),
                    value_type=definition.value_type,
                    default_value=definition.serialize(definition.default),
                    description=definition.description,
                    category=definition.category,
                )
        for definition in definitions.values():
            settings_crud.sync_setting_metadata(
                db,
                key=definition.key,
                value_type=definition.value_type,
                default_value=definition.serialize(definition.default),
                description=definition.description,
                category=definition.category,
            )

        rows = settings_crud.get_all_settings(db)
        raw_cache: Dict[str, str] = {}
        typed_cache: Dict[str, Any] = {}

        for row in rows:
            if not row.key:
                continue
            key = cast(str, row.key)
            raw_value = cast(str, row.value) if row.value is not None else "null"
            raw_cache[key] = raw_value

            definition = definitions.get(key)
            if definition:
                typed_value = definition.deserialize(raw_value)
                if typed_value is None:
                    typed_cache[key] = definition.default
                else:
                    typed_cache[key] = typed_value
            else:
                typed_cache[key] = self._deserialize_unknown(raw_value)

        fingerprint = self._fingerprint_from_raw(raw_cache)
        return typed_cache, raw_cache, fingerprint

    @staticmethod
    def _deserialize_unknown(raw_value: str) -> Any:
        try:
            return json.loads(raw_value)
        except json.JSONDecodeError:
            return raw_value

    @staticmethod
    def _fingerprint_from_raw(raw_cache: Dict[str, str]) -> str:
        payload = json.dumps(dict(sorted(raw_cache.items())), separators=(",", ":"))
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    @staticmethod
    def _diff(
        old: Dict[str, Any], new: Dict[str, Any]
    ) -> Dict[str, Tuple[Any | None, Any | None]]:
        changes: Dict[str, Tuple[Any | None, Any | None]] = {}
        removed_keys = set(old.keys()) - set(new.keys())
        for key in removed_keys:
            changes[key] = (old.get(key), None)
        for key, new_value in new.items():
            old_value = old.get(key)
            if old_value != new_value:
                changes[key] = (old_value, new_value)
        return changes


dynamic_settings = DynamicSettingsCache(DYNAMIC_SETTINGS_REGISTRY)


def refresh_dynamic_settings_cache(force: bool = False) -> Dict[str, Tuple[Any | None, Any | None]]:
    """Public helper to refresh and log cache changes."""

    changes = dynamic_settings.refresh(force=force)
    if changes:
        formatted = ", ".join(
            f"{key}: {old!r} -> {new!r}" for key, (old, new) in sorted(changes.items())
        )
        logger.info("Dynamic settings updated: %s", formatted)
    return changes


def get_role_based_limit(limit_type: str, user_role: str) -> int:
    """
    Get the limit for a specific user role from role-based settings.
    
    Args:
        limit_type: The type of limit ('COURSE_CREATION', 'PRESENT_COURSES', 'CHAT_USAGE')
        user_role: The user role (from UserRole enum)
    
    Returns:
        The limit for the role, or -1 for unlimited
    """
    setting_key = f"ROLE_BASED_{limit_type}_LIMITS"
    limits_dict = dynamic_settings.get(setting_key)
    
    if not isinstance(limits_dict, dict):
        logger.warning("Role-based limits setting %s is not a dictionary, using default limit of 0", setting_key)
        return 0
    
    # Get the limit for the role, default to 0 if role not found
    limit = limits_dict.get(user_role, 0)
    
    if not isinstance(limit, int):
        logger.warning("Limit for role %s in %s is not an integer, using default limit of 0", user_role, setting_key)
        return 0
    
    return limit


def is_unlimited_for_role(limit_type: str, user_role: str) -> bool:
    """
    Check if a user role has unlimited access for a specific limit type.
    
    Args:
        limit_type: The type of limit ('COURSE_CREATION', 'PRESENT_COURSES', 'CHAT_USAGE')
        user_role: The user role (from UserRole enum)
    
    Returns:
        True if the role has unlimited access (-1), False otherwise
    """
    return get_role_based_limit(limit_type, user_role) == -1


def list_dynamic_settings(db: Session) -> List[Dict[str, Any]]:
    """Return dynamic settings along with metadata."""

    rows = settings_crud.get_all_settings(db)
    row_map: Dict[str, AppSetting] = {
        cast(str, row.key): row for row in rows if row.key is not None
    }

    known_keys = set(DYNAMIC_SETTINGS_REGISTRY.keys())
    persisted_keys = set(row_map.keys())
    combined_keys = sorted(known_keys | persisted_keys)

    results: List[Dict[str, Any]] = []
    for key in combined_keys:
        definition = DYNAMIC_SETTINGS_REGISTRY.get(key)
        row = row_map.get(key)

        if definition:
            current_value: Any
            if row and row.value is not None:
                current_value = definition.deserialize(cast(str, row.value))
            else:
                current_value = definition.default

            default_value: Any = definition.default
            if row and row.default_value is not None:
                default_value = definition.deserialize(cast(str, row.default_value))

            description = definition.description
            if row and row.description:
                description = row.description

            category = definition.category
            if row and getattr(row, "category", None):
                category = cast(str, row.category)

            results.append(
                {
                    "key": key,
                    "value": current_value,
                    "default_value": default_value,
                    "value_type": definition.value_type,
                    "description": description,
                    "category": category,
                    "created_at": row.created_at if row else None,
                    "updated_at": row.updated_at if row else None,
                }
            )
            continue

        if not row:
            continue

        category = cast(str, row.category) if getattr(row, "category", None) else "uncategorized"

        results.append(
            {
                "key": key,
                "value": _deserialize_unknown_value(cast(str, row.value))
                if row.value is not None
                else None,
                "default_value": _deserialize_unknown_value(cast(str, row.default_value))
                if row.default_value is not None
                else None,
                "value_type": row.value_type,
                "description": row.description,
                "category": category,
                "created_at": row.created_at,
                "updated_at": row.updated_at,
            }
        )

    return results


def update_dynamic_settings(db: Session, updates: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Persist updates to dynamic settings and return the updated records."""

    if not updates:
        return []

    definitions = DYNAMIC_SETTINGS_REGISTRY
    existing_rows = settings_crud.get_settings_by_keys(db, updates.keys())

    rows_to_refresh: List[AppSetting] = []

    for key, raw_value in updates.items():
        definition = definitions.get(key)
        if not definition:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Unknown dynamic setting '{key}'",
            )

        typed_value = _coerce_setting_value(definition, raw_value)
        try:
            serialized_value = definition.serialize(typed_value)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(exc),
            ) from exc

        row = existing_rows.get(key)
        if not row:
            row = settings_crud.create_setting(
                db,
                key=key,
                value=serialized_value,
                value_type=definition.value_type,
                default_value=definition.serialize(definition.default),
                description=definition.description,
                category=definition.category,
            )
            existing_rows[key] = row
        else:
            row.value = serialized_value
            row.value_type = definition.value_type
            row.default_value = definition.serialize(definition.default)
            row.description = definition.description
            row.category = definition.category

        rows_to_refresh.append(row)

    db.commit()
    for row in rows_to_refresh:
        db.refresh(row)

    dynamic_settings.refresh(force=True)

    updated_records: List[Dict[str, Any]] = []
    for row in rows_to_refresh:
        key = cast(str, row.key)
        definition = definitions[key]
        value = definition.deserialize(cast(str, row.value)) if row.value is not None else definition.default
        default_value = (
            definition.deserialize(cast(str, row.default_value))
            if row.default_value is not None
            else definition.default
        )

        updated_records.append(
            {
                "key": key,
                "value": value,
                "default_value": default_value,
                "value_type": definition.value_type,
                "description": definition.description,
                "category": row.category or definition.category,
                "created_at": row.created_at,
                "updated_at": row.updated_at,
            }
        )
        logger.info("Dynamic setting '%s' updated to %r", key, value)

    return updated_records


def _coerce_setting_value(definition: DynamicSettingDefinition, raw_value: Any) -> Any:
    """Cast *raw_value* to the type declared by *definition*."""

    target_type = definition.value_type.lower()

    if raw_value is None:
        return None

    if target_type == "int":
        try:
            return int(raw_value)
        except (TypeError, ValueError) as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid integer for setting '{definition.key}'",
            ) from exc

    if target_type in {"float", "double", "number"}:
        try:
            return float(raw_value)
        except (TypeError, ValueError) as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid number for setting '{definition.key}'",
            ) from exc

    if target_type == "bool":
        if isinstance(raw_value, bool):
            return raw_value
        if isinstance(raw_value, (int, float)):
            return bool(raw_value)
        if isinstance(raw_value, str):
            normalized = raw_value.strip().lower()
            if normalized in {"true", "1", "yes", "on"}:
                return True
            if normalized in {"false", "0", "no", "off"}:
                return False
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid boolean for setting '{definition.key}'",
        )

    if target_type == "str":
        return str(raw_value)

    return raw_value


def _deserialize_unknown_value(raw_value: str) -> Any:
    try:
        return json.loads(raw_value)
    except json.JSONDecodeError:
        return raw_value
