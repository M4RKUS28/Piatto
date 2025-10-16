"""
This defines a ExplainerAgent class which wraps the event handling,
runner from adk and calls to visualizer agent into a simple run() method
"""
import json
import os
import re
from typing import AsyncGenerator, Optional, Dict, Any

from google.adk.agents import LlmAgent, BaseAgent, LoopAgent
from google.adk.tools import google_search

#from google.adk.models.lite_llm import LiteLlm
from google.adk.runners import Runner
from google.genai import types
#from litellm import max_tokens
from google_images_search import GoogleImagesSearch
import re

from ..code_checker.code_checker import ESLintValidator, clean_up_response
from ..agent import StandardAgent
from ..utils import load_instructions_from_files, create_text_query
from ...services.settings_service import dynamic_settings
import logging
logger = logging.getLogger(__name__)


class CodingExplainer(StandardAgent):
    def __init__(self, app_name: str, session_service):
        files = ["explainer_agent/instructions.txt"]
        files.extend([f"explainer_agent/plugin_docs/{filename}" for filename in os.listdir(os.path.join(os.path.dirname(__file__), "plugin_docs"))])
        full_instructions = load_instructions_from_files(sorted(files))

        dynamic_instructions = """
END OF INSTRUCTIONS
- - - - - -
## Current course creation state
Initial Interaction:
Nexora: "What do you want to learn today?"
User: "{query}"

All chapters, created by the Planner Agent:
{chapters_str}

Please only include content about the chapter that is assigned to you in the following query.
        """

        self.model = dynamic_settings.get("EXPLAINER_AGENT_MODEL")  # leave this as a field for cost calculation
        self.full_instructions = full_instructions + dynamic_instructions
        explainer_agent = LlmAgent(
            name="explainer_agent",
            model=self.model,
            description="Agent for creating engaging visual explanations using react",
            global_instruction=lambda _: full_instructions,
            instruction=dynamic_instructions,
            tools=[google_search]

        )

        # Assign attributes
        self.app_name = app_name
        self.session_service = session_service
        self.runner = Runner(
            agent=explainer_agent,
            app_name=self.app_name,
            session_service=self.session_service,
        )


class ExplainerAgent(StandardAgent):
    """
    Custom loop agent to provide a feedback loop between the explainer and the react parser.
    I unfortunately cannot use adks loop agent because of missing functionality,
    see https://github.com/google/adk-python/issues/1235
    """
    def __init__(self, app_name: str, session_service):
        self.iterations = dynamic_settings.get_int("EXPLAINER_AGENT_ITERATIONS")
        self.explainer = CodingExplainer(app_name=app_name, session_service=session_service)
        self.eslint = ESLintValidator()
        self.gis = GoogleImagesSearch(developer_key=os.getenv("GCS_DEVELOPER_KEY"), custom_search_cx=os.getenv("GCS_CX"))

    def replace_google_images(self, input_string):
        """
        Simulates a Google Image Search for the Agent
        Extracts GoogleImage tags, searches for images, and replaces with img tags.
        """
        placeholder = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/330px-Placeholder_view_vector.svg.png"
        # Find all GoogleImage tags and their content
        pattern = r'<GoogleImage>(.*?)</GoogleImage>'
        matches = re.findall(pattern, input_string)
        result = input_string

        for idx, query in enumerate(matches):
            logger.debug("Searching for google image for query %d: %s", idx, query)
            # Search for the image
            search_params = {
                'q': query,
                'num': 1,
                'safe': 'off',
            }
            self.gis.search(search_params=search_params)

            # Get first result or use placeholder
            if self.gis.results():
                image_url = self.gis.results()[0].url
            else:
                image_url = placeholder

            # Replace the GoogleImage tag with img tag
            old_tag = f'<GoogleImage>{query}</GoogleImage>'
            new_tag = f'<img src="{image_url}" alt="{query}"/>'
            result = result.replace(old_tag, new_tag, 1)

        return result

    async def run(self, user_id: str, state: dict, content: types.Content, debug: bool = False) -> Dict[str, Any]:
        """
        Simple for loop to create the logic for the iterated code review.
        :param user_id: id of the user
        :param state: the state created from the StateService
        :param content: the user query as a type.Content object
        :param debug: if true the method will print auxiliary outputs (all events)
        :return: the parsed dictionary response from the agent
        """
        validation_check = {"errors": []}
        # Log inputs and outputs for cost calculation
        inputs = []
        outputs = []
        for _ in range(self.iterations):
            output = (await self.explainer.run(user_id=user_id, state=state, content=content))['output']
            inputs.append(self.explainer.full_instructions)
            outputs.append(output)
        # Log inputs and outputs for cost calculation
        inputs = []
        outputs = []
        for i in range(self.iterations):
            output = (await self.explainer.run(user_id=user_id, state=state, content=content))['output']
            output_replaced = self.replace_google_images(output)
            inputs.append(self.explainer.full_instructions)
            outputs.append(output)
            validation_check = self.eslint.validate_jsx(output_replaced)
            if validation_check['valid']:
                logger.info("Code Validation Passed")
                return {
                    "success": True,
                    "output": clean_up_response(output_replaced),
                    "inputs": inputs,
                    "outputs": outputs,
                    "model": self.explainer.model,
                }
            else:
                content = create_text_query(
                f"""
                You were prompted before, but the code that you output did not pass the syntax validation check.
                Your previous code:
                {output}
                Your code generated the following errors:
                {json.dumps(validation_check['errors'], indent=2)}
                
                Please try again and rewrite your code from scratch, without explanation.
                Your response should start with () => and end with a curly brace.
                """)
                logger.warning("Code did not pass syntax validation. Errors: %s", json.dumps(validation_check['errors'], indent=2))

        return {
            "success": False,
            "message": f"Code did not pass syntax check after {self.iterations} iterations. Errors: \n{json.dumps(validation_check['errors'], indent=2)}",
        }
