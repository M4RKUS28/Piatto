"""
This file defines the service that coordinates the interaction between all the agents
"""
from logging import getLogger

from ..agents.image_analyzer_agent import ImageAnalyzerAgent
from ..agents.recipe_agent import RecipeAgent
from ..db.crud import images_crud
from ..db.models.db_file import Image
from google.adk.sessions import InMemorySessionService
from ..agents.utils import create_text_query, create_docs_query
from ..db.database import get_async_db_context

logger = getLogger(__name__)

class AgentService:
    def __init__(self):
        self.session_service = InMemorySessionService()
        self.app_name = "Piatto"

        self.image_analyzer_agent = ImageAnalyzerAgent(self.app_name, self.session_service)
        self.recipe_agent = RecipeAgent(self.app_name, self.session_service)

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
    async def generate_recipe(self, user_id: str, prompt: str, written_ingredients: str, gen_context_id: int, image_id: int = None):
        if image_id:
            analyzed_ingredients = await self.analyze_ingredients(user_id, image_id)



    async def change_recipe(self, user_id: str, change_prompt: str, recipe_id: int):
        # Prompt/Kontext an Agent übergeben
        # Rezept in Datenbank updaten (als temporär)
        # Neues Rezept zurückgeben
        pass

    '''    
    Requests: 
        POST: generate_recipe(potentiell mit Kontext), change_recipe, save_recipe, start_recipe
        GET: view_recipe, view_options,
    Grober Ablauf:
        POST Request mit Rezeptprompt
        Prompt an Agent -> Drei vorgeschlagene Rezepte, z.B.
            🥔 1. Spanische Tortilla mit Zwiebeln
                ➡️ Ein warmes Stück spanischer Sonne – saftig, herzhaft und wunderbar simpel.
            🇩🇪 2. Bratkartoffeln mit Speck und Spiegelei
                ➡️ Rustikal, knusprig und nach einem langen Tag genau das, was Seele und Bauch brauchen.
            🇫🇷 3. Kartoffelgratin Dauphinois
                ➡️ Cremig, buttrig und wie ein kleiner Ausflug in eine französische Landküche.
        Optionen:
            1: GET request view Recipe x
                1: GET Request zurück (zeig alle drei)
                2: POST Request save recipe
                3: POST Request start recipe
                4: POST Request change recipe (Anpassungsprompt)
            2: POST request mit neuem Rezeptprompt (mit Kontext)
    '''

    # Rezepte kochen:

    async def ask_question(self, user_id: str, cooking_session_id: int, prompt: str, prompt_history_id: int):
        # Prompt/Kontext an Agent übergeben
        # Prompt History in Datenbank speichern
        # Potentiell Rezept updaten
        # Antwort zurückgeben
        pass

    '''
    Requests:
        POST: change_state, ask_question, (start_recipe)
        GET: get_recipe(mit State), get_state, get_prompt_history
    Grober Aufbau/Ablauf:
        View mit Zutaten und Schritt-für-Schritt-Anleitung (Zutaten lassen sich einklappen)
        Schritte nacheinander (Jetziger deutlich, andere ausgegraut (speichern von State))
        Pro Schritt ein Promptfenster (für Fragen, Alternativen, Tipps)
        Timer für Schritte laufen nebenbei (Im Frontend)
    '''