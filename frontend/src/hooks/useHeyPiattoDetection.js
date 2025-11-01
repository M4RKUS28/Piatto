import useWakeword from '@p0llen/wakeword-react/dist/useWakeword';
import * as ort from 'onnxruntime-web';

// Configure ONNX Runtime BEFORE any hook initialization
// This must run at module load time, not in useEffect
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.0/dist/';

/**
 * Custom hook for "Hey Piatto" wake word detection
 * Uses trained ONNX model for accurate detection
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
    modelPath: '/wakeword_model_15.onnx',

    // Confidence threshold (0.0 to 1.0)
    // Higher = fewer false positives, but may miss some detections
    // Lower = more detections, but more false positives
    // Start with 0.85 and adjust based on testing
    confidenceThreshold: 0.85,

    // Silence threshold (RMS value)
    // Ignore very quiet audio to reduce processing
    silenceThreshold: 0.02,

    // MFCC (Mel-frequency cepstral coefficients) options
    // Must match the training configuration
    mfccOptions: {
      numberOfMFCCCoefficients: 13
    }
  });

  return {
    // Wake word detection state
    detected: wakewordDetected,

    // Confidence score (0.0 to 1.0)
    // Higher = more confident the wake word was detected
    confidence,

    // Is currently listening for wake word
    isListening: listening,

    // Start listening for wake word
    startListening: start,

    // Stop listening
    stopListening: stop,

    // Audio analyser node (for visualizations if needed)
    analyser
  };
};

export default useHeyPiattoDetection;
