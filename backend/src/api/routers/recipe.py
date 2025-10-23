import json
from typing import List, Optional

from ...db.database import get_db
from ...services.agent_service import AgentService
from fastapi import APIRouter, HTTPException, Body, Depends
from ..schemas.recipe import (
    GenerateRecipeRequest,
    ChangeRecipeAIRequest,
    ChangeRecipeManualRequest,
    ChangeStateRequest,
    AskQuestionRequest,
    Recipe as RecipeSchema,
    RecipePreview,
    PromptHistory,
    CookingSession,
    Ingredient as IngredientSchema,
    Instruction as InstructionSchema,
)
from ...utils.auth import get_read_write_user_id, get_read_only_user_id, get_user_id_optional, get_read_write_user_token_data
from ...db.crud import recipe_crud
from sqlalchemy.ext.asyncio import AsyncSession


agent_service = AgentService()

router = APIRouter(
    prefix="/recipe",
    tags=["recipe"],
    responses={404: {"description": "Not found"}},
)


@router.get("/{recipe_id}/get", response_model=RecipeSchema)
async def get_recipe(recipe_id: int,
                     db : AsyncSession = Depends(get_db)):
    """
    Retrieve a recipe based on the provided recipe ID.

    Args:
        recipe_id (int): The ID of the recipe to retrieve.

    Returns:
        Recipe: The retrieved recipe.
    """

    recipe = await recipe_crud.get_recipe_by_id(db, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return _serialize_recipe(recipe)

@router.get("/get_all", response_model=List[RecipeSchema])
async def get_all_recipes(user_id: str = Depends(get_read_only_user_id),
                          db : AsyncSession = Depends(get_db)):
    """
    Retrieve all recipes for a given user ID.

    Args:
        user_id (str): The user ID to retrieve recipes for.
    Returns:
        List[Recipe]: A list of retrieved recipes.
    """
    recipes = await recipe_crud.get_all_recipes_by_user_id(db, user_id)
    return [_serialize_recipe(recipe) for recipe in recipes]
                      



@router.put("/change_ai", response_model=RecipeSchema)
async def change_recipe_ai(request: ChangeRecipeAIRequest):
    """
    Modify a recipe using AI based on the user ID, change prompt, and recipe ID.

    Args:
        request (ChangeRecipeAIRequest): The request containing change prompt, and recipe ID.

    Returns:
        Recipe: The modified recipe.
    """
    return await agent_service.change_recipe(request.change_prompt, request.recipe_id)

@router.put("/change_manual", response_model=RecipeSchema)
async def change_recipe_manual(request: ChangeRecipeManualRequest,
                               db: AsyncSession = Depends(get_db)):
    """
    Modify a recipe manually based on the user ID, recipe ID and new recipe.

    Args:
        request (ChangeRecipeManualRequest): The request containing recipe ID and new recipe details.

    Returns:
        Recipe: The modified recipe.
    """
    recipe = await recipe_crud.update_recipe(
        db,
        recipe_id=request.recipe_id,
        title=request.title,
        description=request.description,
        ingredients=request.ingredients,
        instructions=_serialize_instructions_payload(request.instructions),
        image_url=request.image_url,
    )
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return _serialize_recipe(recipe)

@router.post("/{recipe_id}/save")
async def save_recipe(recipe_id: int,
                      db: AsyncSession = Depends(get_db)):
    """
    Save a recipe based on the provided recipe ID.

    Args:
        int: The recipe ID.
    """

    await recipe_crud.update_recipe(db, recipe_id, is_permanent=True)
    return


@router.post("/{recipe_id}/unsave")
async def unsave_recipe(recipe_id: int,
                        db: AsyncSession = Depends(get_db)):
    """Mark a recipe as temporary by clearing its permanent flag."""

    await recipe_crud.update_recipe(db, recipe_id, is_permanent=False)
    return

@router.delete("/{recipe_id}/delete")
async def delete_recipe(recipe_id: int,
                        db: AsyncSession = Depends(get_db)):
    """
    Delete a recipe based on the provided recipe ID.

    Args:
        recipe_id (int): The ID of the recipe to delete.
    """

    await recipe_crud.delete_recipe(db, recipe_id)
    return


def _serialize_recipe(recipe) -> RecipeSchema:
    """Convert ORM recipe to API schema."""
    raw_instructions: list = []
    if recipe.instructions:
        try:
            raw_instructions = json.loads(recipe.instructions)
        except (json.JSONDecodeError, TypeError):
            raw_instructions = []

    instructions_data: List[InstructionSchema] = []
    for entry in raw_instructions:
        if isinstance(entry, InstructionSchema):
            instructions_data.append(entry)
        elif isinstance(entry, dict):
            instructions_data.append(InstructionSchema(**entry))
        else:
            instructions_data.append(InstructionSchema(Instruction=str(entry), timer=None))

    return RecipeSchema(
        id=recipe.id,
        title=recipe.title,
        description=recipe.description,
        ingredients=[
            IngredientSchema(
                id=ingredient.id,
                name=ingredient.name,
                quantity=ingredient.quantity,
                unit=ingredient.unit,
            )
            for ingredient in recipe.ingredients
        ],
        instructions=instructions_data,
        image_url=recipe.image_url,
    )


def _serialize_instructions_payload(instructions: Optional[List[InstructionSchema]]) -> Optional[str]:
    """Convert instruction schemas to JSON string for persistence."""
    if instructions is None:
        return None

    serialized = []
    for instruction in instructions:
        if hasattr(instruction, "model_dump"):
            serialized.append(instruction.model_dump())
        elif isinstance(instruction, dict):
            serialized.append(instruction)
        else:
            serialized.append({"Instruction": str(instruction), "timer": None})
    return json.dumps(serialized)