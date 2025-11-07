"""
WebSocket endpoint for voice assistant with Gemini 2.5 Flash Live API
Handles real-time bidirectional audio streaming with native audio I/O
"""
import asyncio
import json
import io
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...db.database import get_db
from ...db.crud import cooking_crud, recipe_crud, instruction_crud
from ...utils.auth import get_user_id_from_token_ws
from ...config.settings import GEMINI_API_KEY

from google import genai
from google.genai import types

# Configure Gemini client
client = genai.Client(api_key=GEMINI_API_KEY)

router = APIRouter(
    prefix="/ws",
    tags=["websocket"],
)


class VoiceAssistantSession:
    """Manages a voice assistant Live API session"""

    def __init__(
        self,
        websocket: WebSocket,
        session_id: int,
        user_id: str,
        db: AsyncSession
    ):
        self.websocket = websocket
        self.session_id = session_id
        self.user_id = user_id
        self.db = db
        self.live_session = None
        self.is_active = False

    async def get_cooking_context(self) -> str:
        """
        Fetch cooking session context from database
        Returns formatted context string for Gemini
        """
        # Get cooking session
        cooking_session = await cooking_crud.get_cooking_session_by_id(
            self.db,
            self.session_id
        )

        if not cooking_session:
            raise ValueError("Cooking session not found")

        if cooking_session.user_id != self.user_id:
            raise ValueError("Unauthorized access to cooking session")

        # Get recipe
        recipe = await recipe_crud.get_recipe_by_id(
            self.db,
            cooking_session.recipe_id
        )

        if not recipe:
            raise ValueError("Recipe not found")

        # Get instructions
        instructions = await instruction_crud.get_instructions_by_recipe_id(
            self.db,
            cooking_session.recipe_id
        )

        # Format context
        context = f"""You are Piatto, a helpful and friendly cooking assistant with a warm personality.

**Current Recipe: {recipe.title}**

**Ingredients:**
"""
        if recipe.ingredients:
            ingredients_list = json.loads(recipe.ingredients) if isinstance(recipe.ingredients, str) else recipe.ingredients
            for ing in ingredients_list:
                if isinstance(ing, dict):
                    context += f"- {ing.get('name', ing.get('ingredient', 'Unknown'))}"
                    if 'amount' in ing or 'quantity' in ing:
                        amount = ing.get('amount', ing.get('quantity', ''))
                        context += f" ({amount})"
                    context += "\n"
                else:
                    context += f"- {ing}\n"
        else:
            context += "No ingredients listed\n"

        context += f"\n**Current Step:** {cooking_session.state} of {len(instructions)}\n\n**All Cooking Steps:**\n"

        for idx, instruction in enumerate(instructions, 1):
            marker = "→ " if idx == cooking_session.state else "  "
            context += f"{marker}Step {idx}: {instruction.description}"
            if instruction.duration_minutes:
                context += f" (⏱ {instruction.duration_minutes} min)"
            context += "\n"

        context += """
**Your Role:**
- Provide helpful, concise answers about the recipe, ingredients, or cooking steps
- Keep responses brief and practical for someone actively cooking
- Be friendly and encouraging
- If asked about a specific step, refer to the step numbers above
- Answer in the same language the user speaks to you (German or English)
- Use a warm, conversational tone as if you're a helpful friend in the kitchen
"""

        return context

    async def start_live_session(self):
        """Initialize Gemini Live API session with cooking context"""
        try:
            # Get cooking context
            context = await self.get_cooking_context()

            # Configure Live API session
            config = types.LiveConnectConfig(
                response_modalities=["AUDIO"],  # Native audio output
                system_instruction=context,
            )

            # Connect to Live API
            print(f"[Voice Assistant] Connecting to Gemini Live API for session {self.session_id}")
            self.live_session = client.aio.live.connect(
                model="gemini-2.5-flash-native-audio-preview-09-2025",
                config=config
            )

            # Enter async context
            await self.live_session.__aenter__()
            self.is_active = True

            print(f"[Voice Assistant] ✓ Live API session established for cooking session {self.session_id}")

            # Start receiving responses
            asyncio.create_task(self._receive_responses())

        except Exception as e:
            print(f"[Voice Assistant] Error starting Live API session: {e}")
            await self.websocket.send_json({
                "type": "error",
                "message": f"Failed to start voice assistant: {str(e)}"
            })
            raise

    async def _receive_responses(self):
        """
        Receive and forward audio responses from Gemini Live API
        Runs in background task
        """
        try:
            async for response in self.live_session.receive():
                # Check for server content (audio response)
                if response.server_content:
                    # Model has started responding
                    if not response.server_content.turn_complete:
                        # Send processing status
                        try:
                            await self.websocket.send_json({
                                "type": "processing",
                                "message": "Generating response..."
                            })
                        except:
                            pass  # Ignore if websocket closed

                    # Extract audio parts
                    for part in response.server_content.model_turn.parts:
                        if part.inline_data and part.inline_data.mime_type.startswith("audio/"):
                            # Send audio data to frontend
                            try:
                                await self.websocket.send_bytes(part.inline_data.data)
                            except:
                                break  # Stop if websocket closed

                    # Turn complete - audio finished
                    if response.server_content.turn_complete:
                        print(f"[Voice Assistant] Response complete for session {self.session_id}")

                # Check for tool calls (not used currently, but available)
                elif response.tool_call:
                    print(f"[Voice Assistant] Tool call received: {response.tool_call}")

        except Exception as e:
            print(f"[Voice Assistant] Error receiving responses: {e}")
            if self.is_active:
                try:
                    await self.websocket.send_json({
                        "type": "error",
                        "message": "Connection error"
                    })
                except:
                    pass

    async def send_audio_chunk(self, audio_data: bytes):
        """
        Send audio chunk to Gemini Live API
        Audio should be PCM 16-bit, 16kHz, mono
        """
        if not self.is_active or not self.live_session:
            return

        try:
            # Send audio as realtime input
            await self.live_session.send(
                input={"data": audio_data, "mime_type": "audio/pcm"}
            )
        except Exception as e:
            print(f"[Voice Assistant] Error sending audio: {e}")
            raise

    async def close(self):
        """Close the Live API session"""
        self.is_active = False
        if self.live_session:
            try:
                await self.live_session.__aexit__(None, None, None)
                print(f"[Voice Assistant] Session closed for cooking session {self.session_id}")
            except:
                pass
            self.live_session = None


@router.websocket("/voice_assistant")
async def voice_assistant_websocket(
    websocket: WebSocket,
    session_id: int = Query(..., description="Cooking session ID"),
    db: AsyncSession = Depends(get_db)
):
    """
    WebSocket endpoint for Gemini Live API voice assistant

    Protocol:
    - Client connects with cooking session_id
    - Server initializes Live API session with cooking context
    - Client sends binary audio chunks (PCM 16-bit, 16kHz, mono)
    - Server streams audio chunks to Gemini Live API
    - Gemini automatically detects when user stops speaking (VAD)
    - Server streams binary audio response back (PCM 24kHz)
    - Client plays audio response
    """
    await websocket.accept()

    session = None

    try:
        # Authenticate user
        user_id = await get_user_id_from_token_ws(websocket, db)

        if not user_id:
            await websocket.send_json({
                "type": "error",
                "message": "Authentication required"
            })
            await websocket.close(code=1008)
            return

        # Create voice assistant session
        session = VoiceAssistantSession(
            websocket=websocket,
            session_id=session_id,
            user_id=user_id,
            db=db
        )

        # Start Gemini Live API session
        await session.start_live_session()

        print(f"[Voice Assistant] ✓ Connected: user={user_id}, session={session_id}")

        # Main message loop
        while session.is_active:
            try:
                message = await websocket.receive()

                if "bytes" in message:
                    # Audio chunk received - forward to Gemini
                    audio_chunk = message["bytes"]
                    await session.send_audio_chunk(audio_chunk)

                elif "text" in message:
                    # Control message
                    try:
                        data = json.loads(message["text"])

                        if data.get("type") == "stop":
                            # Client requested stop
                            print(f"[Voice Assistant] Client requested stop")
                            break

                    except json.JSONDecodeError:
                        print(f"[Voice Assistant] Invalid JSON: {message['text']}")

            except WebSocketDisconnect:
                print(f"[Voice Assistant] Client disconnected: session={session_id}")
                break

    except Exception as e:
        print(f"[Voice Assistant] Error: {e}")
        import traceback
        traceback.print_exc()
        try:
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })
        except:
            pass

    finally:
        # Cleanup
        if session:
            await session.close()
        try:
            await websocket.close()
        except:
            pass
