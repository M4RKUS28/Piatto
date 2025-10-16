"""Database model for application settings stored in the database."""
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, String, Text
from ..database import Base

class AppSetting(Base):
    """Represents a single application setting stored in the database."""

    __tablename__ = "app_settings"

    key = Column(String(150), primary_key=True, index=True)
    value = Column(Text, nullable=False)
    value_type = Column(String(50), nullable=False, default="json")
    default_value = Column(Text, nullable=True)
    category = Column(String(100), nullable=False, default="general")
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
