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

    def create_recipes(self, user_id: str):
        content = create_text_query("Hallo, wie geht es dir")
        self.agent.run(user_id, state={}, content=content)
        pass

    def create_guide(self):
        pass