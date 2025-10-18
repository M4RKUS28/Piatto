"""
Utility class to get the queries for all the agents
As the queries are very text heavy, I do not want to build them up in the agent or state service.
"""
from google.genai import types
from ..agents.utils import create_text_query
import logging

logger = logging.getLogger(__name__)

def get_recipe_gen_query(prompt: str, written_ingredients: str, analyzed_ingredients: str) -> types.Content:
    """ builds the query for the recipe generation agent """
    query = f"""
        System: What do you want to cook?
        User: {prompt}
        System: Any ingredients you want to use?
        User: {written_ingredients}
    """

    if analyzed_ingredients:
        query += f"""
        System: Send me a picture of you pantry/fridge.
        User: The picture included: {analyzed_ingredients}
"""

    return create_text_query(query)

def get_image_gen_query(recipe: dict) -> types.Content:
    """ builds the query for the image generation agent """
    query = f"""
    Recipe Name: {recipe['title']}
    Description: {recipe['description']}
    Ingredients: {[ingr['name'] for ingr in recipe['ingredients']]}
"""
    return create_text_query(query)

def get_chat_agent_query(prompt: str, recipe, cooking_session, prompt_history) -> types.Content:
    """ builds the query for the chat agent """
    query = f"""
    Recipe Name: {recipe.title}
    Description: {recipe.description}
    Instructions: {recipe.instructions}
    Ingredients: {recipe.ingredients}
    State: {cooking_session.state}
    User Question: {prompt}
    Previous Prompts: {prompt_history.prompts}
    Previous Answers: {prompt_history.responses}
    """

    return create_text_query(query)
