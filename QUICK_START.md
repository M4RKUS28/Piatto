# Quick Start: Custom "Hey Piatto" Wake Word

## What You Have Now

✅ **React package installed**: `@p0llen/wakeword-react`
✅ **Custom hook created**: `useHeyPiattoDetection.js`
✅ **UI component ready**: `WakeWordDetection.jsx`
✅ **Integrated**: Added to Instructions page

## What You Need To Do

### Step 1: Set Up Python Environment (~2 minutes)

```bash
cd Piatto
python -m venv wakeword-env

# Activate (Windows Git Bash/MSYS):
source wakeword-env/Scripts/activate

# Activate (Linux/Mac):
source wakeword-env/bin/activate

# Install package:
pip install -i https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple wakeword-detector
```

### Step 2: Record Audio Samples (~10-20 minutes)

```bash
# Create directories
mkdir -p wakeword-training/audio/{positive,negative}
cd wakeword-training
```

**Record positive samples** (You saying "Hey Piatto"):
- Record 20-30 times
- 1-2 seconds each
- Vary tone, speed, distance
- Save as WAV files in `audio/positive/`

**Record negative samples** (Everything else):
- Record 30-50 samples
- Similar words, random speech, noise
- Save as WAV files in `audio/negative/`

**Quick tip**: Use Windows Voice Recorder, Audacity, or any recording app

### Step 3: Train Model (~5-15 minutes)

Copy the training script from [CUSTOM_WAKE_WORD_TRAINING.md](CUSTOM_WAKE_WORD_TRAINING.md#create-training-script) and run:

```bash
python train_model.py
```

**Output**: `hey_piatto_model.onnx`

### Step 4: Deploy Model (~1 minute)

```bash
# From wakeword-training directory:
cp hey_piatto_model.onnx ../frontend/public/wakeword_model.onnx
```

### Step 5: Test! (~1 minute)

```bash
cd ../frontend
npm run dev
```

1. Navigate to Instructions page
2. Click "Start Listening"
3. Allow microphone permission
4. Say "Hey Piatto"
5. Watch the magic! 🎯

## Troubleshooting

### "Failed to load wake word model"
- Check `frontend/public/wakeword_model.onnx` exists
- Restart dev server

### Low accuracy
- Record MORE samples (50+ positive, 100+ negative)
- Adjust `confidenceThreshold` in `useHeyPiattoDetection.js`
- Retrain with more variety

### Python package install fails
```bash
# Try different Python version:
python3.11 -m venv wakeword-env
```

## File Structure

```
Piatto/
├── wakeword-env/              # Python virtual environment
├── wakeword-training/
│   ├── audio/
│   │   ├── positive/          # "Hey Piatto" samples
│   │   └── negative/          # Other audio samples
│   ├── train_model.py         # Training script
│   └── hey_piatto_model.onnx  # Trained model
├── frontend/
│   ├── public/
│   │   └── wakeword_model.onnx    # ← Model goes here
│   └── src/
│       ├── hooks/
│       │   └── useHeyPiattoDetection.js
│       └── components/
│           └── WakeWordDetection.jsx
└── CUSTOM_WAKE_WORD_TRAINING.md   # Detailed guide
```

## Key Files

- **[CUSTOM_WAKE_WORD_TRAINING.md](CUSTOM_WAKE_WORD_TRAINING.md)** - Complete detailed guide
- **[useHeyPiattoDetection.js](frontend/src/hooks/useHeyPiattoDetection.js)** - Custom hook
- **[WakeWordDetection.jsx](frontend/src/components/WakeWordDetection.jsx)** - UI component

## Next Steps After Training

1. **Test thoroughly** - Try different pronunciations, distances, noise levels
2. **Tune threshold** - Adjust `confidenceThreshold` (0.7-0.95) based on performance
3. **Add backend callback** - Integrate audio streaming when wake word detected
4. **Collect more data** - Continuously improve with real usage data

## Alternative: Quick Test Without Training

If you want to test the UI first before training:

The component will show setup instructions and work once you add the model file. You can also temporarily comment out the model requirement in `useHeyPiattoDetection.js` to test the UI flow.

## Support

- **Detailed guide**: [CUSTOM_WAKE_WORD_TRAINING.md](CUSTOM_WAKE_WORD_TRAINING.md)
- **Python package**: https://github.com/P0llen/wakeword-detector
- **React package docs**: Check `node_modules/@p0llen/wakeword-react/README.md`

## Summary

1. ✅ Install Python package
2. ✅ Record 20-30 "Hey Piatto" samples
3. ✅ Record 30-50 negative samples
4. ✅ Train model with `train_model.py`
5. ✅ Copy `wakeword_model.onnx` to `frontend/public/`
6. ✅ Test in browser!

**Total time**: 30-45 minutes for complete custom wake word setup

This will give you **significantly better accuracy** than generic speech recognition for detecting "Hey Piatto"!
