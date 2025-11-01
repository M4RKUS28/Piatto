from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ...db.database import get_db
from ...utils.auth import get_read_write_user_id
from ...db.crud import collection_crud
from ..schemas.collection import (
    Collection,
    CollectionCreate,
    CollectionUpdate,
    CollectionPreview,
    CollectionWithRecipes,
    UpdateCollectionRecipesRequest,
)
from ..schemas.recipe import RecipePreview


router = APIRouter(
    prefix="/collection",
    tags=["collection"],
    responses={404: {"description": "Not found"}},
)


@router.get("/all", response_model=List[CollectionPreview])
async def get_all_collections(
    user_id: str = Depends(get_read_write_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve all collections for the current user.

    Returns:
        List[CollectionPreview]: A list of user's collections with recipe counts and preview images.
    """
    collections = await collection_crud.get_collections_by_user_id(db, user_id)

    result = []
    for collection in collections:
        recipe_count = await collection_crud.get_collection_recipe_count(db, collection.id)
        preview_image_urls = await collection_crud.get_collection_preview_images(db, collection.id, limit=4)
        result.append(CollectionPreview(
            id=collection.id,
            name=collection.name,
            description=collection.description,
            owner_id=collection.owner_id,
            created_at=collection.created_at,
            recipe_count=recipe_count,
            preview_image_urls=preview_image_urls,
        ))

    return result


@router.get("/{collection_id}", response_model=CollectionWithRecipes)
async def get_collection(
    collection_id: int,
    user_id: str = Depends(get_read_write_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve a specific collection with all its recipes.

    Args:
        collection_id (int): The ID of the collection to retrieve.

    Returns:
        CollectionWithRecipes: The collection with full recipe details.
    """
    collection = await collection_crud.get_collection_by_id(db, collection_id, owner_id=user_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    recipes = await collection_crud.get_recipes_in_collection(db, collection_id)

    return CollectionWithRecipes(
        id=collection.id,
        name=collection.name,
        description=collection.description,
        owner_id=collection.owner_id,
        created_at=collection.created_at,
        recipe_ids=[recipe.id for recipe in recipes],
        recipes=[
            RecipePreview(
                id=recipe.id,
                title=recipe.title,
                description=recipe.description,
                image_url=recipe.image_url or "",
                total_time_minutes=recipe.total_time_minutes,
                difficulty=recipe.difficulty,
                food_category=recipe.food_category,
            )
            for recipe in recipes
        ],
    )


@router.post("/create", response_model=Collection)
async def create_collection(
    collection: CollectionCreate,
    user_id: str = Depends(get_read_write_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new collection.

    Args:
        collection (CollectionCreate): The collection data.

    Returns:
        Collection: The created collection.
    """
    new_collection = await collection_crud.create_collection(
        db,
        owner_id=user_id,
        name=collection.name,
        description=collection.description,
    )
    return Collection(
        id=new_collection.id,
        name=new_collection.name,
        description=new_collection.description,
        owner_id=new_collection.owner_id,
        created_at=new_collection.created_at,
        recipe_ids=[],
    )


@router.put("/{collection_id}", response_model=Collection)
async def update_collection(
    collection_id: int,
    collection: CollectionUpdate,
    user_id: str = Depends(get_read_write_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a collection.

    Args:
        collection_id (int): The ID of the collection to update.
        collection (CollectionUpdate): The updated collection data.

    Returns:
        Collection: The updated collection.
    """
    # Verify ownership
    existing = await collection_crud.get_collection_by_id(db, collection_id, owner_id=user_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Collection not found")

    updated_collection = await collection_crud.update_collection(
        db,
        collection_id,
        name=collection.name,
        description=collection.description,
    )

    if not updated_collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    recipes = await collection_crud.get_recipes_in_collection(db, collection_id)

    return Collection(
        id=updated_collection.id,
        name=updated_collection.name,
        description=updated_collection.description,
        owner_id=updated_collection.owner_id,
        created_at=updated_collection.created_at,
        recipe_ids=[recipe.id for recipe in recipes],
    )


@router.delete("/{collection_id}")
async def delete_collection(
    collection_id: int,
    user_id: str = Depends(get_read_write_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a collection.

    Args:
        collection_id (int): The ID of the collection to delete.
    """
    # Verify ownership
    existing = await collection_crud.get_collection_by_id(db, collection_id, owner_id=user_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Collection not found")

    success = await collection_crud.delete_collection(db, collection_id)
    if not success:
        raise HTTPException(status_code=404, detail="Collection not found")

    return {"status": "success"}


@router.patch("/{collection_id}/recipes", response_model=Collection)
async def update_collection_recipes(
    collection_id: int,
    request: UpdateCollectionRecipesRequest,
    user_id: str = Depends(get_read_write_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Update the recipes in a collection.

    Args:
        collection_id (int): The ID of the collection.
        request (UpdateCollectionRecipesRequest): The list of recipe IDs to set.

    Returns:
        Collection: The updated collection.
    """
    # Verify ownership
    existing = await collection_crud.get_collection_by_id(db, collection_id, owner_id=user_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Collection not found")

    await collection_crud.update_collection_recipes(db, collection_id, request.recipe_ids)

    collection = await collection_crud.get_collection_by_id(db, collection_id, owner_id=user_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    return Collection(
        id=collection.id,
        name=collection.name,
        description=collection.description,
        owner_id=collection.owner_id,
        created_at=collection.created_at,
        recipe_ids=request.recipe_ids,
    )


@router.get("/recipe/{recipe_id}/collections", response_model=List[Collection])
async def get_collections_for_recipe(
    recipe_id: int,
    user_id: str = Depends(get_read_write_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all collections that contain a specific recipe.

    Args:
        recipe_id (int): The ID of the recipe.

    Returns:
        List[Collection]: List of collections containing the recipe.
    """
    collections = await collection_crud.get_collections_for_recipe(db, recipe_id, user_id)

    result = []
    for collection in collections:
        recipes = await collection_crud.get_recipes_in_collection(db, collection.id)
        result.append(Collection(
            id=collection.id,
            name=collection.name,
            description=collection.description,
            owner_id=collection.owner_id,
            created_at=collection.created_at,
            recipe_ids=[recipe.id for recipe in recipes],
        ))

    return result
