"""
Defines the output schema for the structured output of the recipe agent
"""
from typing import List, Optional
from pydantic import BaseModel, Field

class Ingredient(BaseModel):
    """Schema representing an ingredient."""
    name: str = (
        Field(description="Name of the ingredient"))
    unit: Optional[str] =(
        Field(description="Unit the ingredient is measured in e.g. Gramms, Cups, Tbs"))
    quantity: Optional[float] = (
        Field(description="Quantity of the ingredient in the given unit"))

class Recipe(BaseModel):
    title: str = (
        Field(description="Name of the recipe, e.g. 'Spaghetti Bolognese'"))
    description: str = (
        Field(description="Short description of the recipe, e.g. 'A classic Italian ragu, simmered to perfection for a rich flavor.'"))
    ingredients: List[Ingredient] = (
        Field(description="List of needed ingredients for the recipe"))
    servings: int = (
        Field(description="Number of servings that the given ingredients produce"))

class Recipes(BaseModel):
    recipes: List[Recipe] = (
        Field(description="List of recipes")
    )
