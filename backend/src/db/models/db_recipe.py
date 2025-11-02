from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func, Boolean, Float
from sqlalchemy.orm import relationship
from ..database import Base


class Recipe(Base):
    """Database model for a recipe."""
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    preparing_session_id = Column(Integer, ForeignKey("preparing_sessions.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    prompt = Column(Text, nullable=False)
    # instructions = Column(Text, nullable=True)  # Store as JSON string
    important_notes = Column(Text, nullable=False, server_default="No special notes provided.")
    cooking_overview = Column(Text, nullable=False, server_default="Follow the instructions sequentially to complete the recipe.")
    image_url = Column(String(255), nullable=True)
    is_permanent = Column(Boolean, default=False)
    total_time_minutes = Column(Integer, nullable=True)
    difficulty = Column(String(20), nullable=True)  # easy, medium, hard
    food_category = Column(String(20), nullable=True)  # vegan, vegetarian, meat
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    

    ingredients = relationship(
        "RecipeIngredient",
        back_populates="recipe",
        cascade="all, delete-orphan",
        order_by="RecipeIngredient.id",
    )

    instruction_steps = relationship(
        "InstructionStep",
        back_populates="recipe",
        cascade="all, delete-orphan",
        order_by="InstructionStep.step_number",
    )

    collections = relationship(
        "Collection",
        secondary="collection_recipes",
        back_populates="recipes"
    )

    preparing_session = relationship("PreparingSession", back_populates="current_recipes")


class RecipeIngredient(Base):
    """Database model for a recipe ingredient scoped to a recipe."""
    __tablename__ = "recipe_ingredients"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    quantity = Column(Float, nullable=True)
    unit = Column(String(50), nullable=True)

    recipe = relationship("Recipe", back_populates="ingredients")


class InstructionStep(Base):
    """Database model for a recipe instruction step."""
    __tablename__ = "instruction_steps"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    step_number = Column(Integer, nullable=False)  # Order of the step (0-indexed)
    heading = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    animation = Column(String(100), nullable=False)  # Animation file name
    timer = Column(Integer, nullable=True)  # Timer duration in seconds

    recipe = relationship("Recipe", back_populates="instruction_steps")


class PreparingSession(Base):
    """Database model for a preparing session."""
    __tablename__ = "preparing_sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    context_suggestions = Column(Text, nullable=True)  # Store suggestions as JSON string
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    current_recipes = relationship("Recipe", back_populates="preparing_session", order_by="Recipe.created_at")


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


class Collection(Base):
    """Database model for a recipe collection."""
    __tablename__ = "collections"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    recipes = relationship(
        "Recipe",
        secondary="collection_recipes",
        back_populates="collections"
    )


class CollectionRecipe(Base):
    """Database model for the many-to-many relationship between collections and recipes."""
    __tablename__ = "collection_recipes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    collection_id = Column(Integer, ForeignKey("collections.id", ondelete="CASCADE"), nullable=False)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    added_at = Column(DateTime, server_default=func.now(), nullable=False)