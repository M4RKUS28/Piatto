# Porcupine Web Wake Word Detection Setup Guide

## Overview
This guide will help you set up Porcupine Wake Word Detection for "Hey Piatto" in your frontend application.

## Step 1: Get Your Free Picovoice AccessKey

1. **Sign up** at [Picovoice Console](https://console.picovoice.ai/)
   - It's completely free, no credit card required
   - Takes less than 2 minutes

2. **Copy your AccessKey** from the main dashboard
   - Keep this key secret (don't commit to git)
   - You'll use this to initialize Porcupine

## Step 2: Create Custom "Hey Piatto" Wake Word

1. **Login** to [Picovoice Console](https://console.picovoice.ai/)

2. **Navigate to Porcupine** (Wake Word Detection)
   - Click on "Porcupine" in the left sidebar
   - Or go directly to the Porcupine section

3. **Create a New Wake Word**
   - Click "Create Wake Word" or similar button
   - Enter the phrase: **"Hey Piatto"**
   - Select language: **English**
   - Select platforms: **Web (WASM)**

4. **Train the Model**
   - The training is automated and takes a few seconds
   - Picovoice will generate a `.ppn` model file

5. **Download the Model**
   - Download the generated `hey-piatto_en_wasm_v3_0_0.ppn` file (name may vary)
   - Save it to: `frontend/public/models/hey-piatto.ppn`

## Step 3: Set Up Environment Variable

Create or update `frontend/.env`:

```env
# Picovoice AccessKey (get from https://console.picovoice.ai/)
VITE_PICOVOICE_ACCESS_KEY=your_access_key_here
```

**IMPORTANT:**
- Make sure `.env` is in your `.gitignore`
- Never commit your AccessKey to version control

## Step 4: Create Models Directory

```bash
cd frontend
mkdir -p public/models
```

Then place your downloaded `hey-piatto.ppn` file into `frontend/public/models/`

## Step 5: File Structure

Your frontend should look like this:

```
frontend/
├── .env                          # Contains VITE_PICOVOICE_ACCESS_KEY
├── public/
│   └── models/
│       └── hey-piatto.ppn        # Your custom wake word model
├── src/
│   ├── hooks/
│   │   └── useWakeWordDetection.js   # Updated hook
│   └── components/
│       └── WakeWordDetection.jsx     # UI component
└── package.json
```

## Step 6: Verify Installation

After completing the steps above, start your dev server:

```bash
cd frontend
npm run dev
```

Navigate to the Instructions page and:
1. Check console for any errors
2. Click "Start Listening"
3. Say "Hey Piatto"
4. You should see detection in UI and console

## Troubleshooting

### Error: "Invalid AccessKey"
- Double-check your `.env` file has the correct key
- Make sure the variable is named `VITE_PICOVOICE_ACCESS_KEY`
- Restart your dev server after adding/changing `.env`

### Error: "Failed to load model"
- Verify the `.ppn` file is in `frontend/public/models/`
- Check the filename matches the path in the code
- Make sure the file isn't corrupted (re-download if needed)

### Error: "Microphone permission denied"
- Click the lock icon in browser address bar
- Set "Microphone" to "Allow"
- Reload the page

### Wake word not detected
- Speak clearly and at normal volume
- Make sure you're saying "Hey Piatto" (not "Hi Piatto")
- Try adjusting your microphone sensitivity in system settings
- Check console logs to see what Porcupine is detecting

## Advanced: Using Built-in Wake Words (Testing)

If you want to test with a built-in wake word before creating your custom one:

Porcupine comes with several pre-trained wake words:
- "Porcupine"
- "Picovoice"
- "Bumblebee"
- "Alexa"
- "Jarvis"
- "Computer"
- "Hey Siri" (for testing)

To test with a built-in word, you can temporarily modify the hook to use `BuiltInKeywords.PORCUPINE` instead of a custom model.

## Production Deployment

### Environment Variables
Make sure to set `VITE_PICOVOICE_ACCESS_KEY` in your production environment:
- Vercel: Settings → Environment Variables
- Netlify: Site settings → Environment Variables
- Other platforms: Follow their environment variable setup docs

### Model Files
Ensure the `.ppn` model file is included in your build:
- Models in `public/` are automatically included in Vite builds
- Verify the file is present after `npm run build`

## Free Tier Limits

Picovoice Free Tier includes:
- ✅ Unlimited custom wake word training
- ✅ Unlimited model downloads
- ✅ 3 custom wake words active at a time
- ✅ Perfect for development and testing
- ✅ 30,000 API calls per month (very generous)

For production with higher traffic, consider upgrading to a paid plan.

## Additional Resources

- [Picovoice Console](https://console.picovoice.ai/)
- [Porcupine Documentation](https://picovoice.ai/docs/porcupine/)
- [GitHub Repository](https://github.com/Picovoice/porcupine)
- [Porcupine Web NPM Package](https://www.npmjs.com/package/@picovoice/porcupine-web)

## Next Steps

Once everything is working:
1. Test thoroughly with different pronunciations
2. Adjust detection sensitivity if needed (via Console)
3. Add callback function to start audio streaming to backend
4. Consider adding visual feedback for better UX
