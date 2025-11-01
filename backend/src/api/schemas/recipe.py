from pydantic import BaseModel
from typing import List, Optional, Literal

class Ingredient(BaseModel):
    """Schema representing an ingredient."""
    id: Optional[int] = None
    name: str
    quantity: Optional[float] = None
    unit: Optional[str] = None  # z.B. Gramm, Tassen, EL

class Instruction(BaseModel):
    """Schema representing a cooking instruction step."""
    id: Optional[int] = None
    heading: str
    description: str
    animation: str
    timer: Optional[int] = None  # in seconds

class Recipe(BaseModel):
    """Schema representing a generated recipe."""
    id: int
    title: str
    description: str
    prompt: str
    ingredients: List[Ingredient]
    instructions: List[Instruction]
    image_url: Optional[str] = None
    total_time_minutes: Optional[int] = None
    difficulty: Optional[Literal["easy", "medium", "hard"]] = None
    food_category: Optional[Literal["vegan", "vegetarian", "beef", "pork", "chicken", "lamb", "fish", "seafood", "mixed-meat"]] = None
    important_notes: str
    cooking_overview: str

    class Config:
        from_attributes = True  # wichtig, wenn du ORM-Objekte nutzt

class RecipePreview(BaseModel):
    """Schema for previewing a recipe."""
    id: int
    title: str
    description: str
    image_url: Optional[str] = None
    total_time_minutes: Optional[int] = None
    difficulty: Optional[Literal["easy", "medium", "hard"]] = None
    food_category: Optional[Literal["vegan", "vegetarian", "beef", "pork", "chicken", "lamb", "fish", "seafood", "mixed-meat"]] = None

    class Config:
        from_attributes = True

class CookingSession(BaseModel):
    """Schema for a cooking session."""
    id: int
    recipe_id: int
    state: int  # 0: not started, 1,2... steps of the recipe

    class Config:
        from_attributes = True

class PromptHistory(BaseModel):
    """Schema for prompt history."""
    prompts: List[str]
    responses: List[str]

    class Config:
        from_attributes = True

class GenerateRecipeRequest(BaseModel):
    """Schema for generating recipes using AI."""
    prompt: str
    written_ingredients: str
    image_key: str
    preparing_session_id: Optional[int] = None


class ChangeRecipeAIRequest(BaseModel):
    """Schema for changing a recipe using AI."""
    change_prompt: str
    recipe_id: int

class ChangeRecipeManualRequest(BaseModel):
    """Schema for manually changing a recipe."""
    recipe_id: int
    title: Optional[str] = None
    description: Optional[str] = None
    ingredients: Optional[List[Ingredient]] = None
    instructions: Optional[List[Instruction]] = None
    image_url: Optional[str] = None
    total_time_minutes: Optional[int] = None
    difficulty: Optional[Literal["easy", "medium", "hard"]] = None
    food_category: Optional[Literal["vegan", "vegetarian", "beef", "pork", "chicken", "lamb", "fish", "seafood", "mixed-meat"]] = None
    important_notes: Optional[str] = None
    cooking_overview: Optional[str] = None

class ChangeStateRequest(BaseModel):
    """Schema for changing the cooking state."""
    cooking_session_id: int
    new_state: int

class AskQuestionRequest(BaseModel):
    """Schema for asking a question during cooking."""
    cooking_session_id: int
    prompt: str
