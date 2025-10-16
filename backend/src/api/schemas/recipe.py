from pydantic import BaseModel
from typing import List, Optional


class Recipe(BaseModel):
    """Schema representing a generated recipe."""
    id: int
    title: str
    description: str
    ingredients: List[str]
    instructions: str
    image_url: str
    is_permanent: bool = False  # falls du sie erstmal temporär speicherst

    class Config:
        from_attributes = True  # wichtig, wenn du ORM-Objekte nutzt

class RecipePreview(BaseModel):
    """Schema for previewing a recipe."""
    id: int
    title: str
    description: str
    image_url: str

    class Config:
        from_attributes = True

class GenerateRecipeRequest(BaseModel):
    """Schema for generating recipes using AI."""
    prompt: str
    gen_context_id: Optional[int] = None

class ChangeRecipeAIRequest(BaseModel):
    """Schema for changing a recipe using AI."""
    change_prompt: str
    recipe_id: int

class ChangeRecipeManualRequest(BaseModel):
    """Schema for manually changing a recipe."""
    recipe_id: int
    recipe: Recipe

class ChangeStateRequest(BaseModel):
    """Schema for changing the cooking state."""
    cooking_session_id: int
    new_state: int

class AskQuestionRequest(BaseModel):
    """Schema for asking a question during cooking."""
    cooking_session_id: int
    prompt: str
