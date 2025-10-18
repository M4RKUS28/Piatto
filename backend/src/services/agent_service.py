"""
This file defines the service that coordinates the interaction between all the agents
"""
import json
from logging import getLogger

from fastapi import Depends, HTTPException

from ..api.schemas.recipe import Recipe

from .query_service import get_recipe_gen_query, get_image_gen_query
from ..agents.image_agent.agent import ImageAgent
from ..agents.image_analyzer_agent import ImageAnalyzerAgent
from ..agents.recipe_agent import RecipeAgent
from ..db.bucket_session import get_bucket_session, get_async_bucket_session
from ..db.crud import recipe_crud
from ..db.crud.bucket_base_repo import get_file, upload_file, save_image_bytes
from google.adk.sessions import InMemorySessionService
from ..agents.utils import create_text_query, create_docs_query
from ..db.database import get_async_db_context, get_db
from sqlalchemy.ext.asyncio import AsyncSession


logger = getLogger(__name__)

class AgentService:
    def __init__(self):
        self.session_service = InMemorySessionService()
        self.app_name = "Piatto"

        self.image_analyzer_agent = ImageAnalyzerAgent(self.app_name, self.session_service)
        self.recipe_agent = RecipeAgent(self.app_name, self.session_service)
        self.image_agent = ImageAgent(self.app_name, self.session_service)

    async def analyze_ingredients(self, user_id: str, image_key: str):
        async with get_async_bucket_session() as bs:
            image: bytes = await get_file(bs, image_key)

        query = create_docs_query("Analyze this image for food items.", [], [image])
        response = await self.image_analyzer_agent.run(
            user_id=user_id,
            state={},
            content=query,
        )

        return response['output']


    # Rezepte Erstellen
    async def generate_recipe(self, user_id: str, prompt: str, written_ingredients: str, preparing_session_id: int = None, image_key: str = None):
        analyzed_ingredients = None
        if image_key:
            analyzed_ingredients = await self.analyze_ingredients(user_id, image_key)

        query = get_recipe_gen_query(prompt, written_ingredients, analyzed_ingredients)
        recipe =  await self.recipe_agent.run(
            user_id=user_id,
            state={},
            content=query,
        )
        image = await self.image_agent.run(
            user_id=user_id,
            state={},
            content=get_image_gen_query(recipe),
        )
        async with get_async_db_context() as db:
            async with get_async_bucket_session() as bs:
                image_saved = await save_image_bytes(bs, user_id, "image", image, "recipe_image.png")
            recipe_db = await recipe_crud.create_recipe(
                db=db,
                user_id=user_id,
                title=recipe['title'],
                description=recipe['description'],
                ingredients=recipe['ingredients'],
                image_url=image_saved['key'],
            )

        return recipe_db.id


    async def change_recipe(self, change_prompt: str, recipe_id: int,db : AsyncSession = Depends(get_db)):
        # Prompt/Kontext an Agent übergeben
        # Agent returned agents/recipe_agent/schema.py:Recipe
        agent_return = ... # Agent call


        recipe = await recipe_crud.update_recipe(
            db=db,
            recipe_id=recipe_id,
            title=agent_return.name,
            description=agent_return.description,
            instructions=agent_return.instructions,
            ingredients=agent_return.ingredients,)
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
        result = Recipe(
            id=recipe.id,
            title=recipe.title,
            description=recipe.description,
            ingredients=json.loads(recipe.ingredients),
            instructions=json.loads(recipe.instructions),
            image_url=recipe.image_url,
        )
        return result

    async def ask_question(self, user_id: str, cooking_session_id: int, prompt: str):
        # Prompt/Kontext an Agent übergeben
        # Prompt History in Datenbank speichern (update_prompt_history)
        # Potentiell Rezept updaten (update_recipe)
        # Antwort zurückgeben
        pass
