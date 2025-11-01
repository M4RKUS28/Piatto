import { useEffect, useRef, useState, useCallback } from 'react';
import * as ort from 'onnxruntime-web';
import Meyda from 'meyda';

// Configure ONNX Runtime BEFORE any hook initialization
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.0/dist/';

/**
 * Custom hook for "Hey Piatto" wake word detection
 * Works with ONNX models expecting shape [1, 16, 96]
 *
 * Features:
 * - Extracts mel spectrogram features (96 bins) using Meyda
 * - Keeps 16 sequential time frames for temporal context
 * - Creates 3D tensor [1, 16, 96] for ONNX model inference
 * - Direct integration with onnxruntime-web
 */
const useHeyPiattoDetection = ({
  modelPath = '/wakeword_model_15.onnx',
  confidenceThreshold = 0.85,
  silenceThreshold = 0.02,
} = {}) => {
  const [wakewordDetected, setWakewordDetected] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [listening, setListening] = useState(false);

  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const analyserRef = useRef(null);
  const sessionRef = useRef(null);
  const meydaRef = useRef(null);
  const featureBuffer = useRef([]); // stores recent feature frames

  const start = useCallback(async () => {
    if (listening) return;
    setListening(true);

    try {
      // Load ONNX model
      console.log('🔄 Loading model:', modelPath);
      sessionRef.current = await ort.InferenceSession.create(modelPath);

      // Verify model inputs
      const inputNames = sessionRef.current.inputNames;
      const outputNames = sessionRef.current.outputNames;
      console.log('📊 Model inputs:', inputNames);
      console.log('📊 Model outputs:', outputNames);

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const sourceNode = audioContextRef.current.createMediaStreamSource(stream);
      sourceNodeRef.current = sourceNode;

      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceNode.connect(analyserRef.current);

      // Create Meyda analyzer for feature extraction
      meydaRef.current = Meyda.createMeydaAnalyzer({
        audioContext: audioContextRef.current,
        source: sourceNode,
        bufferSize: 2048, // Larger buffer for better frequency resolution
        featureExtractors: ['melBands', 'rms'], // Use mel bands instead of MFCC
        numberOfMelBands: 96, // Match model's expected 96 features
        callback: async (features) => {
          if (!features.melBands || features.melBands.length !== 96) {
            console.warn('⚠️ Unexpected melBands length:', features.melBands?.length);
            return;
          }

          if (features.rms < silenceThreshold) return; // Silence gate

          // Buffer feature frames
          featureBuffer.current.push(features.melBands);

          // Keep exactly 16 frames as required by model
          if (featureBuffer.current.length > 16) {
            featureBuffer.current.shift(); // Remove oldest frame
          }

          // Wait until we have 16 frames
          if (featureBuffer.current.length < 16) return;

          // Flatten the 16 frames of 96 features into shape [1, 16, 96]
          const flatFeatures = featureBuffer.current.flat(); // 16 * 96 = 1536 values

          console.log('🧪 Feature buffer size:', featureBuffer.current.length);
          console.log('🧪 Flat features length:', flatFeatures.length);

          try {
            // Create 3D tensor [1, 16, 96]
            const input = new ort.Tensor(
              'float32',
              Float32Array.from(flatFeatures),
              [1, 16, 96]
            );

            console.log('📊 Input tensor shape:', input.dims);

            // Run inference
            const outputMap = await sessionRef.current.run({ input });
            const outputTensor = outputMap[outputNames[0]];
            const result = outputTensor.data[0];

            console.log('🎯 ONNX Confidence:', result.toFixed(4));

            setConfidence(result);

            if (result > confidenceThreshold) {
              setWakewordDetected(true);
              console.log('🎉 Wake word detected! Confidence:', result);
              setTimeout(() => setWakewordDetected(false), 1000);
            }
          } catch (err) {
            console.error('❌ Inference error:', err);
          }
        },
      });

      meydaRef.current.start();
      console.log('✅ Wake word detection started');
    } catch (err) {
      console.error('❌ Wakeword initialization error:', err);
      setListening(false);
      throw err;
    }
  }, [listening, modelPath, confidenceThreshold, silenceThreshold]);

  const stop = useCallback(() => {
    if (!listening) return;

    if (meydaRef.current) {
      meydaRef.current.stop();
      meydaRef.current = null;
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    featureBuffer.current = [];
    setListening(false);
    setWakewordDetected(false);
    console.log('⏹ Wake word detection stopped');
  }, [listening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    detected: wakewordDetected,
    confidence,
    isListening: listening,
    startListening: start,
    stopListening: stop,
    analyser: analyserRef.current,
  };
};

export default useHeyPiattoDetection;
