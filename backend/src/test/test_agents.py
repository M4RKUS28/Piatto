from google.adk.sessions import InMemorySessionService

from backend.src.agents.utils import create_text_query
from backend.src.agents.recipe_agent import RecipeAgent
import pprint
import dotenv
import asyncio

async def test_recipe_agent():
    session_service = InMemorySessionService()
    app = "piatto"
    recipe_agent = RecipeAgent(app, session_service=session_service)

    user_id = "1"
    state = {}
    content = create_text_query(
        "I want to cook a vegetarian, protein-rich dinner that is quick and easy to cook and does not contain Tofu."
    )

    response = await recipe_agent.run(user_id, state, content)

    pprint.pprint(response)

if __name__ == '__main__':
    dotenv.load_dotenv("../../.env")
    asyncio.run(test_recipe_agent())