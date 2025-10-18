"""
Mock data generation for development database seeding.
"""
import json
import logging
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from .models.db_user import User
from .models.db_recipe import Recipe, RecipeIngredient
from ..core.security import get_password_hash
from ..core.enums import UserRole, ThemePreference

logger = logging.getLogger(__name__)


async def seed_mock_data(session: AsyncSession) -> None:
    """
    Populate the database with mock data for development.
    This function will only insert data if the database is empty.
    """
    try:
        # Check if users already exist
        result = await session.execute(select(User).limit(1))
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            logger.info("✅ Database already contains data. Skipping mock data generation.")
            return
        
        logger.info("🌱 Seeding mock data...")
        
        # Create mock users
        users = await _create_mock_users(session)
        
        # Create mock recipes
        await _create_mock_recipes(session, users)
        
        await session.commit()
        logger.info("✅ Mock data seeding completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Error seeding mock data: {e}", exc_info=True)
        await session.rollback()
        raise


async def _create_mock_users(session: AsyncSession) -> list[User]:
    """Create mock users."""
    users_data = [
        {
            "id": "demo-user-1",
            "username": "demo_chef",
            "email": "demo@piatto-cooks.com",
            "password": "Demo123!",
            "role": UserRole.USER,
            "theme": ThemePreference.LIGHT,
            "is_verified": True,
        },
        {
            "id": "demo-user-2",
            "username": "gordon_ramsay",
            "email": "gordon@piatto-cooks.com",
            "password": "Gordon123!",
            "role": UserRole.PLUS_USER,
            "theme": ThemePreference.DARK,
            "is_verified": True,
        },
        {
            "id": "admin-user",
            "username": "admin",
            "email": "admin@piatto-cooks.com",
            "password": "Admin123!",
            "role": UserRole.ADMIN,
            "theme": ThemePreference.DARK,
            "is_verified": True,
        },
    ]
    
    users = []
    for user_data in users_data:
        password = user_data.pop("password")
        user = User(
            **user_data,
            hashed_password=get_password_hash(password),
            is_active=True,
            created_at=datetime.now(timezone.utc),
            last_login=datetime.now(timezone.utc),
            login_streak=0,
        )
        session.add(user)
        users.append(user)
        logger.info(f"  → Created user: {user.username} ({user.email})")
    
    await session.flush()
    return users


async def _create_mock_recipes(session: AsyncSession, users: list[User]) -> None:
    """Create mock recipes with ingredients."""
    recipes_data = [
        {
            "user_id": users[0].id,
            "title": "Classic Italian Carbonara",
            "description": "A traditional Italian pasta dish with eggs, cheese, bacon, and black pepper. Simple yet incredibly delicious!",
            "instructions": json.dumps([
                "Bring a large pot of salted water to boil and cook spaghetti according to package directions",
                "While pasta cooks, fry the bacon until crispy, then set aside",
                "In a bowl, whisk together eggs, Parmesan cheese, and black pepper",
                "When pasta is ready, reserve 1 cup of pasta water and drain the rest",
                "Add hot pasta to the pan with bacon, remove from heat",
                "Pour in the egg mixture and toss quickly, adding pasta water to create a creamy sauce",
                "Serve immediately with extra Parmesan and black pepper"
            ]),
            "is_permanent": False,
            "ingredients": [
                {"name": "Spaghetti", "quantity": 400, "unit": "g"},
                {"name": "Bacon or Pancetta", "quantity": 200, "unit": "g"},
                {"name": "Eggs", "quantity": 4, "unit": "pcs"},
                {"name": "Parmesan Cheese", "quantity": 100, "unit": "g"},
                {"name": "Black Pepper", "quantity": 1, "unit": "tsp"},
                {"name": "Salt", "quantity": 1, "unit": "tsp"},
            ]
        },
        {
            "user_id": users[0].id,
            "title": "Creamy Tomato Soup",
            "description": "A comforting and rich tomato soup perfect for cold days. Pairs wonderfully with grilled cheese sandwiches.",
            "instructions": json.dumps([
                "Heat olive oil in a large pot over medium heat",
                "Add diced onions and garlic, sauté until softened",
                "Add canned tomatoes, vegetable broth, and herbs",
                "Simmer for 20 minutes, stirring occasionally",
                "Use an immersion blender to puree the soup until smooth",
                "Stir in heavy cream and season with salt and pepper",
                "Garnish with fresh basil and serve hot"
            ]),
            "is_permanent": False,
            "ingredients": [
                {"name": "Canned Tomatoes", "quantity": 800, "unit": "g"},
                {"name": "Onion", "quantity": 1, "unit": "pcs"},
                {"name": "Garlic Cloves", "quantity": 3, "unit": "pcs"},
                {"name": "Vegetable Broth", "quantity": 500, "unit": "ml"},
                {"name": "Heavy Cream", "quantity": 200, "unit": "ml"},
                {"name": "Olive Oil", "quantity": 2, "unit": "tbsp"},
                {"name": "Fresh Basil", "quantity": 10, "unit": "g"},
                {"name": "Salt and Pepper", "quantity": 1, "unit": "to taste"},
            ]
        },
        {
            "user_id": users[1].id,
            "title": "Gordon's Beef Wellington",
            "description": "An elegant and show-stopping dish featuring tender beef wrapped in puff pastry with mushroom duxelles.",
            "instructions": json.dumps([
                "Season beef fillet with salt and pepper, sear in hot pan until browned on all sides",
                "Let beef cool, then brush with mustard",
                "Prepare mushroom duxelles: finely chop mushrooms and cook until all liquid evaporates",
                "Roll out puff pastry and spread with mushroom mixture",
                "Wrap beef tightly in prosciutto, then in pastry",
                "Brush with egg wash and refrigerate for 30 minutes",
                "Bake at 200°C (400°F) for 25-30 minutes until golden",
                "Rest for 10 minutes before slicing and serving"
            ]),
            "is_permanent": False,
            "ingredients": [
                {"name": "Beef Fillet", "quantity": 800, "unit": "g"},
                {"name": "Puff Pastry", "quantity": 500, "unit": "g"},
                {"name": "Mushrooms", "quantity": 400, "unit": "g"},
                {"name": "Prosciutto", "quantity": 150, "unit": "g"},
                {"name": "Dijon Mustard", "quantity": 2, "unit": "tbsp"},
                {"name": "Egg", "quantity": 1, "unit": "pcs"},
                {"name": "Salt and Pepper", "quantity": 1, "unit": "to taste"},
            ]
        },
        {
            "user_id": users[1].id,
            "title": "Pan-Seared Salmon with Lemon Butter",
            "description": "Perfectly crispy skin salmon with a bright and flavorful lemon butter sauce.",
            "instructions": json.dumps([
                "Pat salmon fillets dry and season with salt and pepper",
                "Heat oil in a pan over medium-high heat",
                "Place salmon skin-side down and press gently for crispy skin",
                "Cook for 4-5 minutes without moving",
                "Flip and cook for another 2-3 minutes",
                "Remove salmon and make sauce: add butter, lemon juice, and capers to pan",
                "Pour sauce over salmon and garnish with fresh dill"
            ]),
            "is_permanent": False,
            "ingredients": [
                {"name": "Salmon Fillets", "quantity": 4, "unit": "pcs"},
                {"name": "Butter", "quantity": 50, "unit": "g"},
                {"name": "Lemon", "quantity": 1, "unit": "pcs"},
                {"name": "Capers", "quantity": 2, "unit": "tbsp"},
                {"name": "Fresh Dill", "quantity": 10, "unit": "g"},
                {"name": "Olive Oil", "quantity": 2, "unit": "tbsp"},
                {"name": "Salt and Pepper", "quantity": 1, "unit": "to taste"},
            ]
        },
        {
            "user_id": users[0].id,
            "title": "Chocolate Chip Cookies",
            "description": "Classic homemade cookies that are crispy on the outside and chewy on the inside.",
            "instructions": json.dumps([
                "Preheat oven to 180°C (350°F)",
                "Cream together butter and both sugars until fluffy",
                "Beat in eggs and vanilla extract",
                "Mix in flour, baking soda, and salt",
                "Fold in chocolate chips",
                "Drop spoonfuls onto baking sheet, spacing them apart",
                "Bake for 10-12 minutes until golden brown",
                "Cool on baking sheet for 5 minutes, then transfer to wire rack"
            ]),
            "is_permanent": False,
            "ingredients": [
                {"name": "Butter", "quantity": 225, "unit": "g"},
                {"name": "Brown Sugar", "quantity": 150, "unit": "g"},
                {"name": "White Sugar", "quantity": 100, "unit": "g"},
                {"name": "Eggs", "quantity": 2, "unit": "pcs"},
                {"name": "Vanilla Extract", "quantity": 1, "unit": "tsp"},
                {"name": "All-Purpose Flour", "quantity": 280, "unit": "g"},
                {"name": "Baking Soda", "quantity": 1, "unit": "tsp"},
                {"name": "Salt", "quantity": 0.5, "unit": "tsp"},
                {"name": "Chocolate Chips", "quantity": 300, "unit": "g"},
            ]
        },
    ]
    
    for recipe_data in recipes_data:
        ingredients_data = recipe_data.pop("ingredients")
        
        recipe = Recipe(**recipe_data)
        session.add(recipe)
        await session.flush()  # Get the recipe ID
        
        # Add ingredients
        for ingredient_data in ingredients_data:
            ingredient = RecipeIngredient(
                recipe_id=recipe.id,
                **ingredient_data
            )
            session.add(ingredient)
        
        logger.info(f"  → Created recipe: {recipe.title} (by {recipe_data['user_id']})")
    
    await session.flush()
