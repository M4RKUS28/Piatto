from pydantic import BaseModel
from typing import List, Optional

class Ingredient(BaseModel):
    """Schema representing an ingredient."""
    name: str
    quantity: Optional[int] = None
    unit: Optional[str] = None  # z.B. Gramm, Tassen, EL

class Instruction(BaseModel):
    """Schema representing a cooking instruction step."""
    Instruction: str
    timer: Optional[int] = None  # in Sekunden

class Recipe(BaseModel):
    """Schema representing a generated recipe."""
    id: int
    title: str
    description: str
    ingredients: List[Ingredient]
    instructions: List[Instruction]
    image_url: int

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
    gen_context_id: Optional[int] = None

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

class ChangeStateRequest(BaseModel):
    """Schema for changing the cooking state."""
    cooking_session_id: int
    new_state: int

class AskQuestionRequest(BaseModel):
    """Schema for asking a question during cooking."""
    cooking_session_id: int
    prompt: str
