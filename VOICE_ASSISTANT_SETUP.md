# Voice Assistant Setup - Gemini 2.5 Flash Live API

This document describes the setup and implementation of the voice assistant using Google's Gemini 2.5 Flash Live API with native audio capabilities.

## Architecture Overview

### Technology Stack
- **Frontend**: Web Audio API for real-time PCM conversion
- **Backend**: FastAPI WebSocket + Google Gemini Live API
- **AI Model**: `gemini-2.5-flash-native-audio-preview-09-2025`
- **Audio Format**:
  - Input: PCM 16-bit, 16kHz, mono
  - Output: PCM 16-bit, 24kHz, mono

### Flow Diagram

```
User says "Hey Piatto"
    ↓
Wake Word Detection (Web Speech API)
    ↓
Start MediaRecorder → Convert to PCM 16kHz
    ↓
Stream audio chunks via WebSocket
    ↓
Backend: Gemini Live API Session
    ├─ Context: Recipe, Ingredients, Current Step
    ├─ Automatic VAD (Voice Activity Detection)
    └─ Native Audio Response (24kHz PCM)
    ↓
Stream audio response back to frontend
    ↓
Play audio with Web Audio API
    ↓
Ready for next "Hey Piatto"
```

## Setup Instructions

### 1. Backend Setup

#### Install Dependencies

```bash
cd backend
pip install google-genai
```

#### Configure Environment Variables

Add to your `.env` file:

```bash
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your API key from: https://aistudio.google.com/app/apikey

#### Verify Installation

```python
from google import genai
client = genai.Client(api_key="YOUR_KEY")
print("Gemini client initialized successfully!")
```

### 2. Frontend Setup

No additional dependencies needed! Uses native browser APIs:
- `AudioContext` for PCM conversion
- `ScriptProcessorNode` for real-time audio processing
- `WebSocket` for bidirectional streaming

### 3. Testing

#### Start Backend
```bash
cd backend
uvicorn src.main:app --reload
```

#### Start Frontend
```bash
cd frontend
npm run dev
```

#### Test Voice Assistant

1. Navigate to a recipe's cooking instructions
2. Click "Start Session" and enable voice assistant
3. Wait for wake word detection to initialize
4. Say "Hey Piatto" clearly
5. After the beep, ask a question:
   - "What ingredients do I need?"
   - "How long should I cook this?"
   - "What's the next step?"
   - "Wie viele Minuten noch?" (German works too!)

## Key Features

### ✅ Implemented

1. **Real-time Bidirectional Streaming**
   - Audio chunks streamed as they're recorded
   - No waiting for complete recording

2. **Automatic Voice Activity Detection (VAD)**
   - Gemini detects when user stops speaking
   - No manual silence detection needed
   - Default: 300ms silence threshold

3. **Native Audio I/O**
   - Gemini speaks with HD voice (30 voices, 24 languages)
   - No separate TTS required
   - Natural, human-like responses

4. **Context-Aware Responses**
   - Full recipe context loaded at session start
   - Knows current cooking step
   - Understands ingredients and timing

5. **Multilingual Support**
   - Seamlessly switches between languages
   - No configuration needed
   - German/English mix supported

6. **Interruption Support**
   - Can be interrupted mid-response
   - Natural conversation flow

### 📋 Configuration Options

#### Backend (`voice_assistant.py`)

```python
# Configure voice and speech settings
config = types.LiveConnectConfig(
    response_modalities=["AUDIO"],
    system_instruction=context,
    # Speech configuration for natural voice
    speech_config=types.SpeechConfig(
        voice_config=types.VoiceConfig(
            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                voice_name="Orus"  # Friendly, warm voice for cooking
                # Other options: "Puck", "Charon", "Kore", "Fenrir", "Orus"
            )
        )
    ),
)
```

**Important**: The backend uses the v1beta API version for enhanced features:

```python
client = genai.Client(
    http_options={"api_version": "v1beta"},
    api_key=GEMINI_API_KEY
)
```

#### Frontend (`useWakeWordDetection.js`)

```javascript
// Adjust recording parameters
const maxRecordingTime = 30000; // Max 30 seconds
const debounceInterval = 3000;  // 3 seconds between wake word detections

// Adjust audio chunk size
const processor = audioContext.createScriptProcessor(
  4096,  // Buffer size (samples) - affects latency
  1,     // Input channels
  1      // Output channels
);
```

## Implementation Details

### Google Live API v1beta Integration

The implementation follows Google's official best practices for the Gemini Live API:

**Key Features:**

1. **v1beta API Version**: Uses the latest API features with enhanced response handling
2. **Audio Buffering**: Separate queue for smooth audio playback without stuttering
3. **Interruption Support**: Automatically clears queued audio when user interrupts
4. **Turn-Based Processing**: Supports multiple "Hey Piatto" interactions per session
5. **Voice Selection**: Uses "Orus" voice for warm, friendly cooking assistance

**Response Structure:**

```python
# v1beta uses simpler response attributes:
async for response in turn:
    if data := response.data:        # Audio chunks
        queue.put_nowait(data)
    if text := response.text:        # Text responses (debugging)
        print(text)
    if tool_call := response.tool_call:  # Future tool support
        handle_tool_call(tool_call)
```

**Audio Pipeline:**

1. Frontend sends PCM audio → WebSocket → Backend
2. Backend streams to Gemini Live API
3. Gemini processes with automatic VAD
4. Audio response → Queue → WebSocket → Frontend
5. Frontend plays audio with Web Audio API

## Technical Details

### Audio Format Conversion

#### Input (Microphone → Gemini)
```javascript
// Browser captures audio at device sample rate
const audioContext = new AudioContext({ sampleRate: 16000 });

// Convert Float32 [-1, 1] to Int16 PCM
const pcmData = new Int16Array(inputData.length);
for (let i = 0; i < inputData.length; i++) {
  const s = Math.max(-1, Math.min(1, inputData[i]));
  pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
}
```

#### Output (Gemini → Speaker)
```javascript
// Gemini sends PCM at 24kHz
const audioContext = new AudioContext({ sampleRate: 24000 });

// Convert Int16 PCM to Float32 for playback
const float32Data = new Float32Array(int16Data.length);
for (let i = 0; i < int16Data.length; i++) {
  float32Data[i] = int16Data[i] / (int16Data[i] < 0 ? 0x8000 : 0x7FFF);
}
```

### WebSocket Protocol

#### Client → Server
```
Binary: PCM audio chunks (ArrayBuffer)
```

#### Server → Client
```javascript
// Control messages (JSON)
{ "type": "processing", "message": "..." }
{ "type": "error", "message": "..." }

// Audio response (Binary)
ArrayBuffer with PCM data
```

### Session Lifecycle

```python
# 1. Client connects
await websocket.accept()

# 2. Initialize Gemini Live API session
self.live_session = client.aio.live.connect(
    model="gemini-2.5-flash-native-audio-preview-09-2025",
    config=config
)

# 3. Stream audio bidirectionally
# Client → Server → Gemini
await session.send(input={"data": audio_data, "mime_type": "audio/pcm"})

# Gemini → Server → Client
async for response in session.receive():
    await websocket.send_bytes(response.server_content.model_turn.parts[0].inline_data.data)

# 4. Close on disconnect
await session.close()
```

## Troubleshooting

### Issue: "WebSocket connection error"
**Solution**: Ensure backend is running and GEMINI_API_KEY is set

### Issue: "Failed to access microphone"
**Solution**: Grant microphone permissions in browser settings

### Issue: "No audio playback"
**Solutions**:
1. Check browser console for errors
2. Ensure speakers/headphones are connected
3. Try saying "Hey Piatto" more clearly
4. Check microphone input levels

### Issue: "Audio quality is poor"
**Solutions**:
1. Reduce background noise
2. Speak closer to microphone
3. Ensure good internet connection (affects streaming)

### Issue: "Wake word not detected"
**Solutions**:
1. Say "Hey Piatto" more clearly
2. Check browser console - wake word detection logs all attempts
3. Try variations: "Hi Piatto", "Hey Piatto"

### Issue: "Response is cut off"
**Solution**: This is the automatic VAD working - pause longer between sentences

## Performance Optimization

### Reduce Latency
```javascript
// Smaller buffer size = lower latency, higher CPU usage
const processor = audioContext.createScriptProcessor(2048, 1, 1);
```

### Reduce Bandwidth
```python
# Use lower quality voice (optional)
config = types.LiveConnectConfig(
    response_modalities=["AUDIO"],
    speech_config={
        "voice_config": {
            "prebuilt_voice_config": {
                "voice_name": "Puck"  # Lighter voice
            }
        }
    }
)
```

## API Limits & Costs

- **Concurrent Sessions**: Up to 1,000
- **Session Duration**: 10 minutes (default), extendable
- **Rate Limits**: Check Google Cloud Console
- **Pricing**: Pay-per-use, see https://ai.google.dev/pricing

## Future Improvements

- [ ] Add support for custom voices
- [ ] Implement conversation history
- [ ] Add volume control for responses
- [ ] Support for custom wake words
- [ ] Offline mode with local STT/TTS
- [ ] Multi-turn conversations without wake word
- [ ] Emotion detection in user voice
- [ ] Proactive suggestions (timer reminders)

## Resources

- [Gemini Live API Documentation](https://ai.google.dev/gemini-api/docs/live)
- [Google GenAI Python SDK](https://github.com/googleapis/python-genai)
- [Web Audio API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [AudioContext Guide](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext)

## License

This implementation is part of the Piatto cooking assistant platform.
