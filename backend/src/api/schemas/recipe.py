from pydantic import BaseModel
from typing import List, Optional


class Recipe(BaseModel):
    """Schema representing a generated recipe."""
    id: int
    title: str
    ingredients: List[str]
    instructions: str
    image_url: str
    is_permanent: bool = False  # falls du sie erstmal temporär speicherst

    class Config:
        from_attributes = True  # wichtig, wenn du ORM-Objekte nutzt

class GenerateRecipeRequest(BaseModel):
    """Schema for generating recipes using AI."""
    user_id: str
    prompt: str
    gen_context_id: Optional[int] = None

class ChangeRecipeAIRequest(BaseModel):
    """Schema for changing a recipe using AI."""
    user_id: str
    change_prompt: str
    recipe_id: int

class ChangeRecipeManualRequest(BaseModel):
    """Schema for manually changing a recipe."""
    user_id: str
    recipe_id: int
    recipe: Recipe

class SaveRecipeRequest(BaseModel):
    """Schema for saving a recipe permanently."""
    user_id: str
    recipe_id: int

class StartRecipeRequest(BaseModel):
    """Schema for starting to cook a recipe."""
    user_id: str
    recipe_id: int

class ChangeStateRequest(BaseModel):
    """Schema for changing the cooking state."""
    cooking_session_id: int
    new_state: int

class AskQuestionRequest(BaseModel):
    """Schema for asking a question during cooking."""
    cooking_session_id: int
    prompt: str
    prompt_history_id: Optional[int] = None
