import { useState, useEffect, useRef, useCallback } from 'react';
import { PorcupineWorker } from '@picovoice/porcupine-web';
import { WebVoiceProcessor } from '@picovoice/web-voice-processor';

/**
 * Custom hook for detecting wake word "Hey Piatto" using Porcupine
 * More accurate than Web Speech API, uses deep learning models
 */
const useWakeWordDetectionPorcupine = () => {
  const [isListening, setIsListening] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [detectionCount, setDetectionCount] = useState(0);
  const [lastDetectedTime, setLastDetectedTime] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [browserSupported, setBrowserSupported] = useState(true);

  const porcupineRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Debug log helper
  const debugLog = useCallback((message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    if (data) {
      console.log(`[Porcupine ${timestamp}] ${message}`, data);
    } else {
      console.log(`[Porcupine ${timestamp}] ${message}`);
    }
  }, []);

  // Check browser support
  useEffect(() => {
    const checkSupport = async () => {
      try {
        // Check if AudioContext is supported
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
          debugLog('ERROR: Web Audio API not supported');
          setBrowserSupported(false);
          setError('Your browser does not support audio processing. Please use a modern browser.');
          return;
        }

        // Check if WebAssembly is supported
        if (typeof WebAssembly === 'undefined') {
          debugLog('ERROR: WebAssembly not supported');
          setBrowserSupported(false);
          setError('Your browser does not support WebAssembly. Please update your browser.');
          return;
        }

        debugLog('✓ Browser support check passed');
      } catch (err) {
        debugLog('Error checking browser support:', err.message);
        setBrowserSupported(false);
        setError('Browser compatibility check failed.');
      }
    };

    checkSupport();
  }, [debugLog]);

  // Initialize Porcupine
  const initializePorcupine = useCallback(async () => {
    if (isInitializedRef.current) {
      debugLog('Porcupine already initialized');
      return true;
    }

    setIsLoading(true);
    debugLog('=== INITIALIZING PORCUPINE ===');

    try {
      // Get AccessKey from environment
      const accessKey = import.meta.env.VITE_PICOVOICE_ACCESS_KEY;

      if (!accessKey) {
        throw new Error(
          'VITE_PICOVOICE_ACCESS_KEY not found in environment variables. ' +
          'Please add it to your .env file. See PORCUPINE_SETUP_GUIDE.md for instructions.'
        );
      }

      debugLog('Creating Porcupine Worker...');

      // Create Porcupine worker with custom wake word
      porcupineRef.current = await PorcupineWorker.create(
        accessKey,
        [
          {
            // Custom wake word model
            publicPath: '/models/hey-piatto.ppn',
            label: 'hey-piatto',
          }
        ],
        // Detection callback
        (keywordDetection) => {
          const { label } = keywordDetection;
          debugLog('🎯 WAKE WORD DETECTED!', { label });

          setDetectionCount(prev => prev + 1);
          setLastDetectedTime(new Date());

          // TODO: Add callback here to trigger audio streaming to backend
          // For example: onWakeWordDetected?.();
        },
        {
          // Model version (use latest)
          modelVersion: '3.0',

          // Sensitivity (0 to 1, higher = more sensitive but more false positives)
          // 0.5 is balanced, adjust based on testing
          sensitivity: 0.5,
        }
      );

      isInitializedRef.current = true;
      setError(null);
      debugLog('✓ Porcupine initialized successfully');

      return true;
    } catch (err) {
      debugLog('ERROR initializing Porcupine:', err.message);

      let errorMessage = 'Failed to initialize wake word detection. ';

      if (err.message.includes('AccessKey')) {
        errorMessage += 'Invalid or missing AccessKey. Please check your .env file.';
      } else if (err.message.includes('model') || err.message.includes('.ppn')) {
        errorMessage += 'Failed to load wake word model. Make sure hey-piatto.ppn is in public/models/.';
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage += 'Network error. Please check your internet connection.';
      } else {
        errorMessage += err.message;
      }

      setError(errorMessage);
      setIsActive(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [debugLog]);

  // Start listening
  const startListening = useCallback(async () => {
    debugLog('Starting listening...');

    try {
      // Initialize Porcupine if not already done
      if (!isInitializedRef.current) {
        const success = await initializePorcupine();
        if (!success) {
          return;
        }
      }

      // Start the WebVoiceProcessor to capture microphone audio
      debugLog('Starting WebVoiceProcessor...');

      await WebVoiceProcessor.subscribe(porcupineRef.current);

      setIsListening(true);
      setError(null);
      debugLog('✓ Started listening for "Hey Piatto"');

    } catch (err) {
      debugLog('ERROR starting listening:', err.message);

      let errorMessage = 'Failed to start listening. ';

      if (err.message.includes('permission') || err.message.includes('denied')) {
        errorMessage += 'Microphone permission denied. Please allow microphone access and try again.';
        setIsActive(false);
      } else if (err.message.includes('NotFoundError')) {
        errorMessage += 'No microphone found. Please connect a microphone and try again.';
        setIsActive(false);
      } else if (err.message.includes('NotReadableError')) {
        errorMessage += 'Microphone is being used by another application. Please close other apps using the microphone.';
        setIsActive(false);
      } else {
        errorMessage += err.message;
      }

      setError(errorMessage);
      setIsListening(false);
    }
  }, [initializePorcupine, debugLog]);

  // Stop listening
  const stopListening = useCallback(async () => {
    debugLog('Stopping listening...');

    try {
      if (porcupineRef.current) {
        await WebVoiceProcessor.unsubscribe(porcupineRef.current);
        debugLog('✓ Stopped listening');
      }

      setIsListening(false);
      setIsActive(false);

    } catch (err) {
      debugLog('Error stopping listening:', err.message);
      // Still set states even if error occurs
      setIsListening(false);
      setIsActive(false);
    }
  }, [debugLog]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debugLog('Component unmounting - cleaning up Porcupine');

      // Unsubscribe from voice processor
      if (porcupineRef.current) {
        WebVoiceProcessor.unsubscribe(porcupineRef.current).catch(err => {
          debugLog('Error during cleanup:', err.message);
        });
      }

      // Release Porcupine resources
      if (porcupineRef.current) {
        porcupineRef.current.release().catch(err => {
          debugLog('Error releasing Porcupine:', err.message);
        });
        porcupineRef.current = null;
      }

      isInitializedRef.current = false;
    };
  }, [debugLog]);

  // Toggle listening
  const toggleListening = useCallback(async () => {
    if (isActive && isListening) {
      await stopListening();
    } else {
      setIsActive(true);
      setError(null);
      debugLog('=== STARTING WAKE WORD DETECTION ===');
      await startListening();
    }
  }, [isActive, isListening, startListening, stopListening, debugLog]);

  return {
    isListening,
    isActive,
    isLoading,
    detectionCount,
    lastDetectedTime,
    error,
    browserSupported,
    toggleListening,
  };
};

export default useWakeWordDetectionPorcupine;
