"""
This is a small question-answer agent that functions like a standard gemini api call.
It is used for small requests like generating a course description.
It also handles session creation itself, which sets it apart from the other agents.
"""
import json
import os
import asyncio
from typing import Dict, Any

from google.adk.agents import LlmAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService

from ..callbacks import get_url_from_response
from ..utils import create_text_query, load_instruction_from_file
from ..agent import StandardAgent
from ...services.settings_service import dynamic_settings
from ..tools.unsplash import search_photos


class ImageAgent(StandardAgent):
    def __init__(self, app_name: str, session_service):
        self.model = dynamic_settings.get("IMAGE_AGENT_MODEL")
        self.full_instructions = load_instruction_from_file("image_agent/instructions.txt")

        # Create the image agent
        image_agent = LlmAgent(
            name="image_agent",
            model=self.model,
            description="Agent for searching an image for a course using an external service.",
            instruction=self.full_instructions,
            tools=[search_photos],
            after_model_callback=get_url_from_response
        )

        # Create necessary
        self.app_name = app_name
        self.session_service = session_service
        self.runner = Runner(
            agent=image_agent,
            app_name=self.app_name,
            session_service=self.session_service,
        )


async def main():
    import logging
    logging.getLogger(__name__).info("Starting ImageAgent")
    # Renamed variable for clarity, as 'image_agent' is used inside __init__ for LlmAgent
    image_agent_instance = ImageAgent(app_name="Nexora", session_service=InMemorySessionService())
    response = await image_agent_instance.run(user_id="test", state={}, content=create_text_query("ein vector-bild zum thema branch and bound algorithmus"))
    import logging
    logging.getLogger(__name__).info("ImageAgent response: %s", response)
    logging.getLogger(__name__).info("done")

if __name__ == "__main__":
    asyncio.run(main())