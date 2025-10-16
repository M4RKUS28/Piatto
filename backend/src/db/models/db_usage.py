from datetime import datetime, timezone

from sqlalchemy import (Column, DateTime,  # Added Text and DateTime
                        Integer, String, Text)
from ..database import Base


class Usage(Base):
    """Model for tracking user actions and interactions with the system."""
    __tablename__ = "usages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(50), nullable=False)
    course_id = Column(Integer, nullable=True)  # Nullable for global actions not tied to a specific course
    chapter_id = Column(Integer, nullable=True)  # Nullable for global actions not tied to a specific chapter
    action = Column(String(50), nullable=False)  # e.g., "view", "complete", "start", "create", "delete"
    details = Column(Text, nullable=True)  # Additional details about the action
    # store timezone-aware timestamps (maps to TIMESTAMP WITH TIME ZONE on Postgres)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)