"""
Agent for generating custom images, e.g. an image of a recipe
"""
import asyncio
from google import genai
from google.genai import types
from PIL import Image
from io import BytesIO

from backend.src.agents.utils import create_text_query, load_instruction_from_file


class ImageAgent:
    def __init__(self, app_name, session_service):
        self.client = genai.Client() # use normal gemini client because it is easier to use with image output
        self.full_instructions = load_instruction_from_file("image_agent/instructions.txt")

    async def run(self, user_id: str, state: dict, content: types.Content):
        response = self.client.models.generate_content(
            model="gemini-2.5-flash-image",
            contents=[self.full_instructions + content.parts[0].text],
        )

        for part in response.candidates[0].content.parts:
            if part.inline_data is not None:
                return part.inline_data.data

        return None


async def test_agent():
    agent = ImageAgent()
    query = """Image of a korean bbq"""

    data = await agent.run("1", {}, create_text_query(query))
    image = Image.open(BytesIO(data))
    image.save("generated_image.png")

if __name__ == '__main__':
    asyncio.run(test_agent())