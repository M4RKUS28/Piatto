# Quick Start: Porcupine Wake Word Detection

## What Was Implemented

✅ **Installed Porcupine Web** - Professional-grade wake word detection using deep learning
✅ **Custom Hook** - `useWakeWordDetectionPorcupine.js` with full error handling
✅ **UI Component** - Visual feedback, loading states, and controls
✅ **Integration** - Added to Instructions page

## Next Steps (5 minutes setup)

### 1. Get Your Free AccessKey

Visit: https://console.picovoice.ai/

1. Click "Sign Up" (no credit card needed)
2. Log in to your account
3. Copy your **AccessKey** from the dashboard
4. Keep this key safe

### 2. Create Your .env File

```bash
cd frontend
```

Create a file named `.env` with this content:

```env
VITE_PICOVOICE_ACCESS_KEY=paste_your_access_key_here
```

Replace `paste_your_access_key_here` with the AccessKey you copied.

### 3. Create Custom Wake Word Model

While logged into Picovoice Console:

1. Click **"Porcupine"** in the sidebar
2. Click **"Create Wake Word"**
3. Enter phrase: `Hey Piatto`
4. Select language: `English`
5. Select platform: `Web (WASM)`
6. Click **"Train"** (takes ~10 seconds)
7. Click **"Download"**
8. Save the file as `hey-piatto.ppn`

### 4. Place the Model File

Move the downloaded file to:
```
frontend/public/models/hey-piatto.ppn
```

The path should look like:
```
Piatto/
└── frontend/
    └── public/
        └── models/
            └── hey-piatto.ppn  ← Place file here
```

### 5. Start Development Server

```bash
cd frontend
npm run dev
```

### 6. Test It!

1. Open your browser to the dev server URL
2. Navigate to any recipe's **Instructions page**
3. You'll see the "Voice Wake Word Detection" module
4. Click **"Start Listening"**
5. Allow microphone permission when prompted
6. Say **"Hey Piatto"** clearly
7. Watch for the green detection box!

## Troubleshooting

### "Invalid AccessKey" Error
- Double-check the key in your `.env` file
- Make sure variable is named `VITE_PICOVOICE_ACCESS_KEY`
- Restart dev server after creating `.env`

### "Failed to load model" Error
- Verify file is at `frontend/public/models/hey-piatto.ppn`
- Check the filename is exactly `hey-piatto.ppn`
- Make sure you downloaded the **Web (WASM)** version

### Wake Word Not Detected
- Speak clearly at normal volume
- Say "Hey Piatto" with slight pause between words
- Make sure microphone is working (check system settings)
- Check browser console for debug logs

### Permission Denied
- Click lock icon in address bar
- Set "Microphone" to "Allow"
- Reload the page

## What's Different from Web Speech API?

The old implementation used Web Speech API (browser built-in):
- ❌ Less accurate
- ❌ Prone to false positives
- ❌ Required constant restarts
- ❌ Language-dependent transcription issues

The new Porcupine implementation:
- ✅ **Much more accurate** - Uses deep learning trained specifically for wake words
- ✅ **Fewer false positives** - Tuned for wake word detection
- ✅ **No restarts needed** - Runs continuously
- ✅ **Optimized for performance** - Efficient WebAssembly implementation
- ✅ **Production-ready** - Used in commercial products

## Files Created/Modified

**New Files:**
- `frontend/src/hooks/useWakeWordDetectionPorcupine.js` - Main hook
- `frontend/.env.example` - Environment template
- `frontend/public/models/README.md` - Model directory docs
- `PORCUPINE_SETUP_GUIDE.md` - Detailed setup guide
- `QUICK_START_PORCUPINE.md` - This file

**Modified Files:**
- `frontend/src/components/WakeWordDetection.jsx` - Updated to use Porcupine
- `frontend/package.json` - Added Porcupine dependencies
- `frontend/.gitignore` - Added .env exclusion

**Old Files (kept for reference):**
- `frontend/src/hooks/useWakeWordDetection.js` - Old Web Speech API version

## Next: Backend Integration

Once wake word detection is working, you can add the callback to start audio streaming:

In `useWakeWordDetectionPorcupine.js` around line 90, you'll see:
```javascript
// TODO: Add callback here to trigger audio streaming to backend
// For example: onWakeWordDetected?.();
```

You can add your backend streaming logic there!

## Console Logs

Watch for these debug messages:
- `[Porcupine HH:MM:SS] === INITIALIZING PORCUPINE ===`
- `[Porcupine HH:MM:SS] ✓ Porcupine initialized successfully`
- `[Porcupine HH:MM:SS] ✓ Started listening for "Hey Piatto"`
- `[Porcupine HH:MM:SS] 🎯 WAKE WORD DETECTED!`

## Support

If you encounter issues:
1. Check the browser console for detailed logs
2. Review `PORCUPINE_SETUP_GUIDE.md` for detailed troubleshooting
3. Verify all steps above were completed
4. Make sure you're using a modern browser (Chrome, Edge, Firefox, Safari)

## License

Porcupine is Apache 2.0 licensed - free for personal and commercial use!
