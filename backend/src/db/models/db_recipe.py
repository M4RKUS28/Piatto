from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func, Boolean
from sqlalchemy.orm import relationship
from ..database import Base


class Recipe(Base):
    """Database model for a recipe."""
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    ingredients = Column(Text, nullable=False)  # Store as JSON string
    instructions = Column(Text, nullable=False)  # Store as JSON string
    image_url = Column(String(255), nullable=True)
    is_permanent = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

class GenContext(Base):
    """Database model for a generation context."""
    __tablename__ = "gen_contexts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    context_data = Column(Text, nullable=False)  # Store context data as JSON string #TODO: define structure
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

class CookingSession(Base):
    """Database model for a cooking session."""
    __tablename__ = "cooking_sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    state = Column(Integer, default=0)  # 0: not started, 1,2... steps of the recipe
    # prompt_histories = Column(Text, nullable=True)  # Store prompt history as JSON string
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    prompt_histories = relationship("PromptHistory", back_populates="cooking_session", cascade="all, delete-orphan")

class PromptHistory(Base):
    """Database model for prompt history during a cooking session."""
    __tablename__ = "prompt_histories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    cooking_session_id = Column(Integer, ForeignKey("cooking_sessions.id"), nullable=False)
    state = Column(Integer, nullable=False)
    prompts = Column(Text, nullable=False)  # Store prompts as JSON string
    responses = Column(Text, nullable=False)  # Store responses as JSON string
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    cooking_session = relationship("CookingSession", back_populates="prompt_histories")