import json
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.api.schemas.recipe import Ingredient
from backend.src.db.models.db_recipe import Recipe, PreparingSession

# TODO