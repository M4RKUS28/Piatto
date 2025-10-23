from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class CollectionBase(BaseModel):
    """Base schema for collection."""
    name: str
    description: Optional[str] = None


class CollectionCreate(CollectionBase):
    """Schema for creating a new collection."""
    pass


class CollectionUpdate(BaseModel):
    """Schema for updating a collection."""
    name: Optional[str] = None
    description: Optional[str] = None


class CollectionPreview(BaseModel):
    """Schema for previewing a collection (without recipes)."""
    id: int
    name: str
    description: Optional[str] = None
    owner_id: str
    created_at: datetime
    recipe_count: int = 0

    class Config:
        from_attributes = True


class Collection(CollectionBase):
    """Schema representing a collection with full details."""
    id: int
    owner_id: str
    created_at: datetime
    recipe_ids: List[int] = []

    class Config:
        from_attributes = True


class CollectionWithRecipes(Collection):
    """Schema representing a collection with its recipes."""
    recipes: List['RecipePreview'] = []

    class Config:
        from_attributes = True


class UpdateCollectionRecipesRequest(BaseModel):
    """Schema for updating recipes in a collection."""
    recipe_ids: List[int]


# Import RecipePreview and rebuild model to resolve forward reference
from .recipe import RecipePreview
CollectionWithRecipes.model_rebuild()
