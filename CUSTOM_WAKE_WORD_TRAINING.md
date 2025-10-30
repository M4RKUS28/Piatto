# Custom "Hey Piatto" Wake Word Training Guide

## Overview

This guide will walk you through training a custom "Hey Piatto" wake word model using the `wakeword-detector` Python package and integrating it with the React frontend.

## Prerequisites

- Python 3.8 - 3.12
- Microphone for recording
- ~30 minutes of time
- (Optional) NVIDIA GPU with CUDA 12.4+ for faster training

## Part 1: Python Backend Setup

### Step 1: Create Python Virtual Environment

```bash
# Navigate to project root
cd Piatto

# Create virtual environment
python -m venv wakeword-env

# Activate environment
# Windows (Git Bash/MSYS):
source wakeword-env/Scripts/activate

# Linux/Mac:
source wakeword-env/bin/activate
```

### Step 2: Install wakeword-detector

```bash
pip install -i https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple wakeword-detector
```

### Step 3: Verify Installation

```bash
python -c "import wakeword_detector; print('Installation successful!')"
```

## Part 2: Recording Audio Samples

You need to record two types of audio samples:

1. **Positive samples**: You saying "Hey Piatto" (~20-30 times)
2. **Negative samples**: Other words, background noise, similar phrases (~30-50 times)

### Create Project Structure

```bash
mkdir -p wakeword-training/audio
cd wakeword-training
mkdir audio/positive
mkdir audio/negative
```

### Recording Positive Samples ("Hey Piatto")

**Manual Recording Method:**

1. Use any recording software (Windows Voice Recorder, Audacity, etc.)
2. Record yourself saying "Hey Piatto" clearly
3. Create 20-30 separate 1-2 second WAV files
4. Save them as: `positive/hey_piatto_01.wav`, `positive/hey_piatto_02.wav`, etc.
5. Place all files in `audio/positive/`

**Tips for Good Training Data:**
- Vary your tone (normal, quiet, loud)
- Different speeds (slow, normal, fast)
- Different distances from microphone
- Different room acoustics if possible
- Clear pronunciation

### Recording Negative Samples

Record 30-50 samples of:
- Similar sounding words: "Hey Plato", "Hey please go", "A piatto"
- Common phrases: "Hey there", "Hello", "OK", numbers, etc.
- Background noise: TV, music, typing, talking
- Silence or ambient room noise

Save as: `negative/sample_01.wav`, `negative/sample_02.wav`, etc.

## Part 3: Training the Model

### Create Training Script

Create `train_model.py` in `wakeword-training/`:

```python
#!/usr/bin/env python3
"""
Training script for 'Hey Piatto' wake word model
"""
import os
import glob
from wakeword_detector import WakeWordTrainer

def main():
    print("🚀 Starting 'Hey Piatto' wake word training...")

    # Paths
    positive_dir = "audio/positive"
    negative_dir = "audio/negative"
    output_model = "hey_piatto_model.onnx"

    # Check directories exist
    if not os.path.exists(positive_dir):
        print(f"❌ Error: {positive_dir} not found!")
        return

    if not os.path.exists(negative_dir):
        print(f"❌ Error: {negative_dir} not found!")
        return

    # Count samples
    positive_files = glob.glob(f"{positive_dir}/*.wav")
    negative_files = glob.glob(f"{negative_dir}/*.wav")

    print(f"📊 Positive samples: {len(positive_files)}")
    print(f"📊 Negative samples: {len(negative_files)}")

    if len(positive_files) < 10:
        print("⚠️  Warning: Less than 10 positive samples. Recommended: 20-30")

    if len(negative_files) < 20:
        print("⚠️  Warning: Less than 20 negative samples. Recommended: 30-50")

    # Initialize trainer
    trainer = WakeWordTrainer(
        positive_dir=positive_dir,
        negative_dir=negative_dir,
        model_name="hey_piatto",
        epochs=50,  # Adjust based on performance
        batch_size=16,
        learning_rate=0.001
    )

    # Train model
    print("\n🎯 Training model...")
    trainer.train()

    # Export to ONNX
    print(f"\n💾 Exporting to {output_model}...")
    trainer.export_onnx(output_model)

    print(f"\n✅ Training complete! Model saved to: {output_model}")
    print(f"\n📋 Next steps:")
    print(f"   1. Copy {output_model} to frontend/public/")
    print(f"   2. Update React app to use the model")
    print(f"   3. Test wake word detection!")

if __name__ == "__main__":
    main()
```

### Run Training

```bash
python train_model.py
```

**Expected output:**
- Training progress with loss values
- Validation accuracy
- Model export confirmation

**Training typically takes:** 5-15 minutes (CPU) or 1-3 minutes (GPU)

## Part 4: Alternative - Quick Test with Pre-recorded Samples

If you want to test quickly before recording your own:

### Use Text-to-Speech for Initial Testing

Create `generate_samples.py`:

```python
#!/usr/bin/env python3
"""
Generate synthetic audio samples for testing
"""
import os
try:
    from gtts import gTTS
    import random
except ImportError:
    print("Installing required packages...")
    os.system("pip install gtts")
    from gtts import gTTS
    import random

os.makedirs("audio/positive", exist_ok=True)
os.makedirs("audio/negative", exist_ok=True)

# Positive samples
positive_phrases = ["Hey Piatto"] * 20

for i, phrase in enumerate(positive_phrases, 1):
    tts = gTTS(text=phrase, lang='en', slow=False)
    tts.save(f"audio/positive/sample_{i:02d}.wav")
    print(f"Generated positive sample {i}")

# Negative samples
negative_phrases = [
    "Hey there", "Hello", "Hey please go", "A piatto",
    "One two three", "How are you", "What time is it",
    "Turn on the lights", "Play music", "Set a timer"
] * 3

for i, phrase in enumerate(negative_phrases, 1):
    tts = gTTS(text=phrase, lang='en', slow=False)
    tts.save(f"audio/negative/sample_{i:02d}.wav")
    print(f"Generated negative sample {i}")

print("\n✅ Generated synthetic samples!")
print("⚠️  Note: For production, record real audio samples!")
```

Run:
```bash
python generate_samples.py
```

## Part 5: Integrate Model with React Frontend

### Step 1: Copy Model to Frontend

```bash
# From wakeword-training directory
cp hey_piatto_model.onnx ../frontend/public/wakeword_model.onnx
```

### Step 2: Update React Hook

The model is already configured! The `useWakeword` hook looks for `/wakeword_model.onnx` by default.

### Step 3: Create Custom Hook Instance

Create `frontend/src/hooks/useHeyPiattoDetection.js`:

```javascript
import { useWakeword } from '@p0llen/wakeword-react';

/**
 * Custom hook for "Hey Piatto" wake word detection
 */
const useHeyPiattoDetection = () => {
  const {
    wakewordDetected,
    confidence,
    listening,
    start,
    stop,
    analyser
  } = useWakeword({
    modelPath: '/wakeword_model.onnx',
    confidenceThreshold: 0.85, // Adjust based on testing (0.7 - 0.95)
    silenceThreshold: 0.02,    // Ignore very quiet audio
    mfccOptions: {
      numberOfMFCCCoefficients: 13 // Match training config
    }
  });

  return {
    detected: wakewordDetected,
    confidence,
    isListening: listening,
    startListening: start,
    stopListening: stop,
    analyser
  };
};

export default useHeyPiattoDetection;
```

### Step 4: Update WakeWordDetection Component

Modify `frontend/src/components/WakeWordDetection.jsx`:

```javascript
import React, { useEffect } from 'react';
import useHeyPiattoDetection from '../hooks/useHeyPiattoDetection';

const WakeWordDetection = () => {
  const {
    detected,
    confidence,
    isListening,
    startListening,
    stopListening
  } = useHeyPiattoDetection();

  const [detectionCount, setDetectionCount] = React.useState(0);
  const [lastDetectedTime, setLastDetectedTime] = React.useState(null);

  useEffect(() => {
    if (detected) {
      console.log('🎯 HEY PIATTO DETECTED! Confidence:', confidence.toFixed(2));
      setDetectionCount(prev => prev + 1);
      setLastDetectedTime(new Date());

      // TODO: Start audio streaming to backend here
    }
  }, [detected, confidence]);

  return (
    <div className="bg-white border-2 border-[#A8C9B8] rounded-xl p-4 sm:p-5 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-[#2D2D2D]">Custom Wake Word Detection</h3>
          <p className="text-xs text-gray-600">Listening for: "Hey Piatto"</p>
        </div>

        <div className="flex items-center gap-2">
          {isListening && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-green-700">Listening</span>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={isListening ? stopListening : startListening}
        className={`
          w-full sm:w-auto px-6 py-3 rounded-lg font-medium text-sm uppercase
          transition-all duration-200 hover:scale-105
          ${isListening
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-[#035035] text-white hover:bg-[#024028]'
          }
        `}
      >
        {isListening ? '⏹ Stop' : '▶ Start Listening'}
      </button>

      {detected && (
        <div className="mt-4 p-3 bg-green-50 border-2 border-green-300 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-800">
                "Hey Piatto" detected!
              </p>
              <p className="text-xs text-green-600 mt-1">
                Confidence: {(confidence * 100).toFixed(1)}%
                {lastDetectedTime && ` • ${lastDetectedTime.toLocaleTimeString()}`}
                {detectionCount > 1 && ` • Total: ${detectionCount}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {isListening && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            💡 Using custom-trained ONNX model. Check console for confidence scores.
          </p>
        </div>
      )}
    </div>
  );
};

export default WakeWordDetection;
```

## Part 6: Testing and Tuning

### Test the Model

1. Start your React dev server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Navigate to Instructions page

3. Click "Start Listening"

4. Say "Hey Piatto" multiple times

5. Check console for confidence scores

### Tuning Parameters

If detection is:

**Too sensitive** (false positives):
- Increase `confidenceThreshold` (try 0.90 or 0.95)
- Record more negative samples
- Retrain model

**Not sensitive enough** (misses wake word):
- Decrease `confidenceThreshold` (try 0.75 or 0.80)
- Record more positive samples with variations
- Retrain model

**Confidence scores to watch:**
- `> 0.9`: Very confident detection
- `0.7 - 0.9`: Good detection
- `0.5 - 0.7`: Uncertain
- `< 0.5`: Likely not wake word

## Troubleshooting

### Python Package Installation Fails

```bash
# Try with specific Python version
python3.11 -m venv wakeword-env
source wakeword-env/bin/activate
pip install --upgrade pip
pip install -i https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple wakeword-detector
```

### Audio Recording Issues

- Install Audacity (free, cross-platform)
- Record at 16kHz, mono, WAV format
- Each clip should be 1-2 seconds

### Model Not Loading in Browser

- Check file path: `/wakeword_model.onnx` (must be in `public/`)
- Check browser console for errors
- Verify model file size (should be few MB)
- Check CORS headers if serving from different domain

### Low Accuracy

- Record MORE samples (aim for 50+ positive, 100+ negative)
- Increase training epochs (try 100 or 200)
- Add more variety in recordings
- Include edge cases (whispered, shouted, far away)

## Production Checklist

Before deploying to production:

- [ ] Train model with high-quality audio samples (50+ positive, 100+ negative)
- [ ] Test with multiple people saying the wake word
- [ ] Test in noisy environments
- [ ] Verify confidence threshold works well
- [ ] Add analytics/logging for detection events
- [ ] Set up model versioning
- [ ] Document model retraining process

## Advanced: Continuous Improvement

1. **Log all detections** with confidence scores
2. **Collect false positives/negatives** from users
3. **Retrain periodically** with new data
4. **A/B test** different confidence thresholds
5. **Monitor performance metrics** in production

## Need Help?

- Check wakeword-detector GitHub issues: https://github.com/P0llen/wakeword-detector/issues
- Review @p0llen/wakeword-react examples
- Test with pre-trained models first before custom training

## Summary

1. ✅ Set up Python environment
2. ✅ Record audio samples (positive + negative)
3. ✅ Train ONNX model
4. ✅ Copy model to frontend/public/
5. ✅ Integrate with React hook
6. ✅ Test and tune confidence threshold
7. ✅ Deploy!

The custom-trained model will be significantly more accurate for "Hey Piatto" than generic speech recognition!
