import json
from typing import List, Optional

from ...db.database import get_db
from ...services.agent_service import AgentService
from fastapi import APIRouter, HTTPException, Body, Depends
from fastapi import status
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

router = APIRouter(
    prefix="/recipe",
    tags=["recipe"],
    responses={404: {"description": "Not found"}},
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

@router.post("/create", response_model=RecipeSchema, status_code=status.HTTP_201_CREATED)
async def create_recipe(request: GenerateRecipeRequest, db: AsyncSession = Depends(get_db), user_id: str = Depends(get_read_write_user_id)):
    """
    Create a new recipe for the given user.

    Args:
        request (GenerateRecipeRequest): The request containing recipe details.
        user_id (str): The user ID creating the recipe.
    Returns:
        Recipe: The created recipe.
    """
    recipe = await recipe_crud.create_recipe(
        db=db,
        user_id=user_id,
        title=request.title,
        description=request.description,
        ingredients=request.ingredients,
    instructions=_serialize_instructions_payload(request.instructions) or "[]",
        image_url=request.image_url,
        total_time_minutes=request.total_time_minutes,
        difficulty=request.difficulty,
        food_category=request.food_category,
    prompt=getattr(request, 'prompt', ""),
        important_notes=getattr(request, 'important_notes', None),
        cooking_overview=getattr(request, 'cooking_overview', None),
    )
    if not recipe:
        raise HTTPException(status_code=400, detail="Recipe creation failed")
    return _serialize_recipe(recipe)

@router.get("/{recipe_id}/get", response_model=RecipeSchema)
async def get_recipe(recipe_id: int,
                     db : AsyncSession = Depends(get_db),
                     user_id: str = Depends(get_read_only_user_id)):
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
    if recipe.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this recipe")
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
async def change_recipe_ai(request: ChangeRecipeAIRequest, 
                           user_id: str = Depends(get_read_write_user_id),
                           db: AsyncSession = Depends(get_db)):
    """
    Modify a recipe using AI based on the user ID, change prompt, and recipe ID.

    Args:
        request (ChangeRecipeAIRequest): The request containing change prompt, and recipe ID.

    Returns:
        Recipe: The modified recipe.
    """
    return await agent_service.change_recipe(request.change_prompt, db=db, recipe_id=request.recipe_id, user_id=user_id)

@router.put("/change_manual", response_model=RecipeSchema)
async def change_recipe_manual(request: ChangeRecipeManualRequest,
                               db: AsyncSession = Depends(get_db),
                               user_id: str = Depends(get_read_write_user_id)):
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
        total_time_minutes=request.total_time_minutes,
        difficulty=request.difficulty,
        food_category=request.food_category,
        important_notes=request.important_notes,
        cooking_overview=request.cooking_overview,
        user_id=user_id
    )
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return _serialize_recipe(recipe)

@router.post("/{recipe_id}/save")
async def save_recipe(recipe_id: int,
                      db: AsyncSession = Depends(get_db),
                      user_id: str = Depends(get_read_write_user_id)):
    """
    Save a recipe based on the provided recipe ID.

    Args:
        int: The recipe ID.
    """

    await recipe_crud.update_recipe(db, recipe_id, is_permanent=True, user_id=user_id)
    return


@router.post("/{recipe_id}/unsave")
async def unsave_recipe(recipe_id: int,
                        db: AsyncSession = Depends(get_db),
                        user_id: str = Depends(get_read_write_user_id)):
    """Mark a recipe as temporary by clearing its permanent flag."""

    await recipe_crud.update_recipe(db, recipe_id, is_permanent=False, user_id=user_id)
    return

@router.delete("/{recipe_id}/delete")
async def delete_recipe(recipe_id: int,
                        db: AsyncSession = Depends(get_db),
                        user_id: str = Depends(get_read_write_user_id)):
    """
    Delete a recipe based on the provided recipe ID.

    Args:
        recipe_id (int): The ID of the recipe to delete.
    """

    await recipe_crud.delete_recipe(db, recipe_id, user_id=user_id)
    return


def _serialize_recipe(recipe) -> RecipeSchema:
    """Convert ORM recipe to API schema."""
    instructions_data: List[InstructionSchema] = []

    # Use the new instruction_steps relationship if available
    if hasattr(recipe, 'instruction_steps') and recipe.instruction_steps:
        instructions_data = [
            InstructionSchema(
                id=step.id,
                heading=step.heading,
                description=step.description,
                animation=step.animation,
                timer=step.timer,
            )
            for step in recipe.instruction_steps
        ]
    # Fallback to old JSON-based instructions for backwards compatibility
    elif recipe.instructions:
        try:
            raw_instructions = json.loads(recipe.instructions)
            for entry in raw_instructions:
                if isinstance(entry, dict):
                    # Try to adapt old format to new format
                    instructions_data.append(InstructionSchema(
                        heading=entry.get("heading", entry.get("Instruction", "")),
                        description=entry.get("description", entry.get("Instruction", "")),
                        animation=entry.get("animation", "let_cook_and_stir.json"),
                        timer=entry.get("timer"),
                    ))
        except (json.JSONDecodeError, TypeError):
            pass

    return RecipeSchema(
        id=recipe.id,
        title=recipe.title,
        description=recipe.description,
        prompt=recipe.prompt,
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
        total_time_minutes=recipe.total_time_minutes,
        difficulty=recipe.difficulty,
        food_category=recipe.food_category,
        important_notes=recipe.important_notes or "No special notes provided.",
        cooking_overview=recipe.cooking_overview or "Follow the instructions sequentially to complete the recipe.",
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