from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func, Boolean, Float
from sqlalchemy.orm import relationship
from ..database import Base


class Recipe(Base):
    """Database model for a recipe."""
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    instructions = Column(Text, nullable=False)  # Store as JSON string
    image_url = Column(String(255), nullable=True)
    is_permanent = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    ingredients = relationship(
        "RecipeIngredient",
        back_populates="recipe",
        cascade="all, delete-orphan",
        order_by="RecipeIngredient.id",
    )


class RecipeIngredient(Base):
    """Database model for a recipe ingredient scoped to a recipe."""
    __tablename__ = "recipe_ingredients"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    quantity = Column(Float, nullable=True)
    unit = Column(String(50), nullable=True)

    recipe = relationship("Recipe", back_populates="ingredients")

class PreparingSession(Base):
    """Database model for a preparing session."""
    __tablename__ = "preparing_sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    context_promts = Column(Text, nullable=False)  # Store context promts as JSON string
    context_suggestions = Column(Text, nullable=True)  # Store suggestions as JSON string
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

class CookingSession(Base):
    """Database model for a cooking session."""
    __tablename__ = "cooking_sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    state = Column(Integer, default=0)  # 0: not started, 1,2... steps of the recipe
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