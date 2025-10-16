"""
This file defines the service that coordinates the interaction between all the agents
"""
import json
import asyncio
import traceback
from typing import List
from logging import getLogger


from google.adk.sessions import InMemorySessionService

from .cost_service import CostService
from ..services import vector_service
from ..services.course_content_service import CourseContentService

from .query_service import QueryService
from .state_service import StateService, CourseState
from ..agents.explainer_agent.agent import ExplainerAgent
from ..agents.grader_agent.agent import GraderAgent
from ..db.crud import chapters_crud, documents_crud, images_crud, questions_crud, courses_crud


from google.adk.sessions import InMemorySessionService

from ..agents.planner_agent import PlannerAgent
from ..agents.info_agent.agent import InfoAgent

from ..agents.image_agent.agent import ImageAgent

from ..agents.tester_agent import TesterAgent
from ..agents.utils import create_text_query
from ..db.models.db_course import CourseStatus
from ..api.schemas.course import CourseRequest
#from ..services.notification_service import WebSocketConnectionManager
from ..db.models.db_course import Course
from ..db.database import get_db_context
from google.genai import types

#from .data_processors.pdf_processor import PDFProcessor

from ..db.models.db_file import Document, Image
from ..db.crud import usage_crud
from ..agents.utils import create_text_query, create_docs_query



logger = getLogger(__name__)


class AgentService:
    def __init__(self):
        self.session_service = InMemorySessionService()
        self.app_name = "Nexora"

        self.agent = TesterAgent(self.app_name, self.session_service)

    # Rezepte Erstellen
    async def generate_recipe(self, user_id: str, prompt: str, gen_context_id: int): # Irgendwie Kontext
        content = create_text_query("Hallo, wie geht es dir")
        agent_return = self.agent.run(user_id, state={}, content=content)
        # Prompt/Kontext an Agent übergeben
        # Rezepte in Datenbank speichern (als temporär)
        # Rezepte zurückgeben
        pass

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