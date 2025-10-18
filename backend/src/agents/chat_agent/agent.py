import asyncio
from google import genai
from google.genai import types

client = genai.Client()
model = "gemini-live-2.5-flash-preview"

config = {"response_modalities": ["TEXT"]}

async def main():
    async with client.aio.live.connect(model=model, config=config) as session:
        message = "Hello, how are you?"
        await session.send_client_content(
            turns={"role": "user", "parts": [{"text": message}]}, turn_complete=True
        )

        async for response in session.receive():
            if response.text is not None:
                print(response.text, end="")

if __name__ == "__main__":
    asyncio.run(main())


class ChatAgent:
    def __init__(self):
        self.client = genai.Client()
        self.model = "gemini-live-2.5-flash-preview"
        self.config = {"response_modalities": ["TEXT"]}

    async def run(self, user_id: str, state: dict, content: types.Content):
        async with self.client.aio.live.connect(model=self.model, config=self.config) as session:
            await session.send_client_content(
                turns={"role": "user", "parts": [{"text": content.parts[0].text}]}, turn_complete=True
            )

        async for response in session.receive():
            if response.text is not None:
                # HIER KANNST DU DEN TEXT ZURÜCK STREAMEN e.g.
                yield response.text