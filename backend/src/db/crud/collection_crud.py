from typing import List, Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models.db_recipe import Collection, CollectionRecipe, Recipe


async def get_collection_by_id(db: AsyncSession, collection_id: int, owner_id: Optional[str] = None) -> Optional[Collection]:
    """Retrieve a collection by its ID, optionally filtering by owner."""
    query = select(Collection).options(selectinload(Collection.recipes)).filter(Collection.id == collection_id)
    if owner_id:
        query = query.filter(Collection.owner_id == owner_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_collections_by_user_id(db: AsyncSession, user_id: str) -> List[Collection]:
    """Retrieve all collections for a user."""
    result = await db.execute(
        select(Collection)
        .filter(Collection.owner_id == user_id)
        .order_by(Collection.created_at.desc())
    )
    return result.scalars().all()


async def get_collection_recipe_count(db: AsyncSession, collection_id: int) -> int:
    """Get the number of recipes in a collection."""
    result = await db.execute(
        select(func.count(CollectionRecipe.id))
        .filter(CollectionRecipe.collection_id == collection_id)
    )
    return result.scalar_one()


async def create_collection(db: AsyncSession, owner_id: str, name: str, description: Optional[str] = None) -> Collection:
    """Create a new collection."""
    collection = Collection(
        owner_id=owner_id,
        name=name,
        description=description,
    )
    db.add(collection)
    await db.commit()
    await db.refresh(collection)
    return collection


async def update_collection(db: AsyncSession, collection_id: int, name: Optional[str] = None, description: Optional[str] = None) -> Optional[Collection]:
    """Update an existing collection."""
    result = await db.execute(
        select(Collection).filter(Collection.id == collection_id)
    )
    collection = result.scalar_one_or_none()
    if not collection:
        return None

    if name is not None:
        collection.name = name
    if description is not None:
        collection.description = description

    db.add(collection)
    await db.commit()
    await db.refresh(collection)
    return collection


async def delete_collection(db: AsyncSession, collection_id: int) -> bool:
    """Delete a collection."""
    result = await db.execute(select(Collection).filter(Collection.id == collection_id))
    collection = result.scalar_one_or_none()
    if not collection:
        return False
    await db.delete(collection)
    await db.commit()
    return True


async def get_recipes_in_collection(db: AsyncSession, collection_id: int) -> List[Recipe]:
    """Get all recipes in a collection."""
    result = await db.execute(
        select(Recipe)
        .join(CollectionRecipe, CollectionRecipe.recipe_id == Recipe.id)
        .filter(CollectionRecipe.collection_id == collection_id)
        .order_by(CollectionRecipe.added_at.desc())
    )
    return result.scalars().all()


async def add_recipe_to_collection(db: AsyncSession, collection_id: int, recipe_id: int) -> bool:
    """Add a recipe to a collection."""
    # Check if already exists
    result = await db.execute(
        select(CollectionRecipe)
        .filter(CollectionRecipe.collection_id == collection_id, CollectionRecipe.recipe_id == recipe_id)
    )
    existing = result.scalar_one_or_none()
    if existing:
        return True  # Already exists, no need to add

    collection_recipe = CollectionRecipe(collection_id=collection_id, recipe_id=recipe_id)
    db.add(collection_recipe)
    await db.commit()
    return True


async def remove_recipe_from_collection(db: AsyncSession, collection_id: int, recipe_id: int) -> bool:
    """Remove a recipe from a collection."""
    result = await db.execute(
        select(CollectionRecipe)
        .filter(CollectionRecipe.collection_id == collection_id, CollectionRecipe.recipe_id == recipe_id)
    )
    collection_recipe = result.scalar_one_or_none()
    if not collection_recipe:
        return False
    await db.delete(collection_recipe)
    await db.commit()
    return True


async def update_collection_recipes(db: AsyncSession, collection_id: int, recipe_ids: List[int]) -> bool:
    """Update the recipes in a collection to match the provided list."""
    # Get current recipe IDs
    result = await db.execute(
        select(CollectionRecipe.recipe_id)
        .filter(CollectionRecipe.collection_id == collection_id)
    )
    current_recipe_ids = set(result.scalars().all())
    new_recipe_ids = set(recipe_ids)

    # Remove recipes that are no longer in the list
    to_remove = current_recipe_ids - new_recipe_ids
    for recipe_id in to_remove:
        await remove_recipe_from_collection(db, collection_id, recipe_id)

    # Add recipes that are new to the list
    to_add = new_recipe_ids - current_recipe_ids
    for recipe_id in to_add:
        await add_recipe_to_collection(db, collection_id, recipe_id)

    return True


async def get_collections_for_recipe(db: AsyncSession, recipe_id: int, user_id: str) -> List[Collection]:
    """Get all collections that contain a specific recipe for a user."""
    result = await db.execute(
        select(Collection)
        .join(CollectionRecipe, CollectionRecipe.collection_id == Collection.id)
        .filter(CollectionRecipe.recipe_id == recipe_id, Collection.owner_id == user_id)
    )
    return result.scalars().all()
