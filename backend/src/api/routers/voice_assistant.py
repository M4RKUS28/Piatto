"""
WebSocket endpoint for voice assistant with Gemini 2.0 Flash
Handles real-time audio streaming with server-side VAD
"""
import asyncio
import json
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...db.database import get_db
from ...db.crud import cooking_crud, recipe_crud, instruction_crud
from ...utils.auth import get_user_id_from_token_ws
from ...config.settings import GEMINI_API_KEY
import google.generativeai as genai

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)

router = APIRouter(
    prefix="/ws",
    tags=["websocket"],
)


class VoiceAssistantSession:
    """Manages a voice assistant WebSocket session"""

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
        self.audio_buffer = []
        self.is_recording = False
        self.gemini_client = None

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
        context = f"""You are Piatto, a helpful cooking assistant. The user is currently cooking the following recipe:

**Recipe: {recipe.title}**

**Ingredients:**
{json.dumps(recipe.ingredients, indent=2) if recipe.ingredients else 'No ingredients listed'}

**Current Step:** {cooking_session.state}

**All Instructions:**
"""

        for idx, instruction in enumerate(instructions, 1):
            context += f"\n{idx}. {instruction.description}"
            if instruction.duration_minutes:
                context += f" (Duration: {instruction.duration_minutes} minutes)"

        context += """

Please provide helpful, concise answers about the recipe, ingredients, or cooking steps.
Keep responses brief and practical for someone actively cooking.
If the user asks about a specific step, refer to the step numbers above.
"""

        return context

    async def process_audio_stream(self):
        """
        Process incoming audio stream and generate response using Gemini 2.0 Flash
        """
        try:
            # Get cooking context
            context = await self.get_cooking_context()

            # Initialize Gemini 2.0 Flash model
            model = genai.GenerativeModel('gemini-2.0-flash-exp')

            # Send processing status
            await self.websocket.send_json({
                "type": "processing",
                "message": "Processing your question..."
            })

            # Combine audio chunks
            if not self.audio_buffer:
                await self.websocket.send_json({
                    "type": "error",
                    "message": "No audio data received"
                })
                return

            # Create audio blob
            audio_data = b''.join(self.audio_buffer)

            # Generate response with Gemini (audio input + text context)
            # Note: Gemini 2.0 Flash supports audio input
            response = await asyncio.to_thread(
                model.generate_content,
                [
                    {
                        "mime_type": "audio/webm",
                        "data": audio_data
                    },
                    context
                ],
                generation_config={
                    "response_modalities": ["audio"],
                    "temperature": 0.7,
                }
            )

            # Extract audio response
            if response and response.parts:
                for part in response.parts:
                    if hasattr(part, 'audio') and part.audio:
                        # Send audio response back to client
                        await self.websocket.send_bytes(part.audio.data)
                    elif hasattr(part, 'text'):
                        # Fallback: send text if audio not available
                        await self.websocket.send_json({
                            "type": "text_response",
                            "text": part.text
                        })
            else:
                await self.websocket.send_json({
                    "type": "error",
                    "message": "No response generated"
                })

        except Exception as e:
            print(f"Error processing audio: {e}")
            await self.websocket.send_json({
                "type": "error",
                "message": f"Error processing audio: {str(e)}"
            })
        finally:
            # Clear buffer
            self.audio_buffer = []
            self.is_recording = False

    async def detect_silence(self, audio_chunk: bytes) -> bool:
        """
        Simple server-side VAD (Voice Activity Detection)
        Returns True if silence is detected

        TODO: Implement more sophisticated VAD if needed
        For now, we rely on client sending 'recording_complete' message
        """
        # Placeholder - actual VAD would analyze audio amplitude/energy
        return False


@router.websocket("/voice_assistant")
async def voice_assistant_websocket(
    websocket: WebSocket,
    session_id: int = Query(..., description="Cooking session ID"),
    db: AsyncSession = Depends(get_db)
):
    """
    WebSocket endpoint for voice assistant

    Protocol:
    - Client connects with cooking session_id
    - Client sends binary audio chunks (webm/opus format)
    - Client sends {"type": "recording_complete"} when done
    - Server processes audio with Gemini 2.0 Flash
    - Server streams binary audio response back
    """
    await websocket.accept()

    try:
        # Get user ID from websocket (check cookies/headers)
        user_id = await get_user_id_from_token_ws(websocket, db)

        if not user_id:
            await websocket.send_json({
                "type": "error",
                "message": "Authentication required"
            })
            await websocket.close(code=1008)
            return

        # Create session
        session = VoiceAssistantSession(
            websocket=websocket,
            session_id=session_id,
            user_id=user_id,
            db=db
        )

        print(f"Voice assistant connected: user={user_id}, session={session_id}")

        # Main message loop
        while True:
            message = await websocket.receive()

            if "bytes" in message:
                # Audio chunk received
                audio_chunk = message["bytes"]
                session.audio_buffer.append(audio_chunk)
                session.is_recording = True

            elif "text" in message:
                # Control message
                try:
                    data = json.loads(message["text"])

                    if data.get("type") == "recording_complete":
                        # Process the complete audio
                        if session.is_recording:
                            await session.process_audio_stream()

                    elif data.get("type") == "stop_recording":
                        # Server VAD detected silence (not used in this implementation)
                        session.is_recording = False

                except json.JSONDecodeError:
                    print(f"Invalid JSON received: {message['text']}")

    except WebSocketDisconnect:
        print(f"Voice assistant disconnected: session={session_id}")
    except Exception as e:
        print(f"Voice assistant error: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })
        except:
            pass
    finally:
        try:
            await websocket.close()
        except:
            pass
