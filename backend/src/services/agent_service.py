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
from ..db.crud import images_crud, recipe_crud
from ..db.models.db_file import Image
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

    async def analyze_ingredients(self, user_id: str, image_id: int):
        async with get_async_db_context() as db:
            image: Image = await images_crud.get_image_by_id(db, image_id)

        query = create_docs_query("Analyze this image for food items.", [], [image])
        response = await self.image_analyzer_agent.run(
            user_id=user_id,
            state={},
            content=query,
        )

        return response['output']


    # Rezepte Erstellen
    async def generate_recipe(self, user_id: str, prompt: str, written_ingredients: str, preparing_session_id: int, image_id: int = None):
        analyzed_ingredients = None
        if image_id:
            analyzed_ingredients = await self.analyze_ingredients(user_id, image_id)

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
            recipe_crud.create_recipe(
                db=db,
                user_id=user_id,
                title=recipe['title'],
                description=recipe['description'],
                ingredients=recipe['ingredients'],
            )
            image_db = images_crud.create_image(
                recipe_id=
            )

        #TODO create recipe in database
        return recipe


    async def change_recipe(self, change_prompt: str, recipe_id: int,db : AsyncSession = Depends(get_db)):
        # Prompt/Kontext an Agent übergeben
        # Rezept in Datenbank updaten (als temporär)
        
        recipe = await recipe_crud.update_recipe(
            db=db,
            recipe_id=recipe_id,
            title="ExampleTitle",
        )
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
