import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for detecting wake word "Hey Piatto" using Web Speech API
 * Auto-restarts listening every 55 seconds to prevent browser timeout
 */
const useWakeWordDetection = () => {
  const [isListening, setIsListening] = useState(false);
  const [isActive, setIsActive] = useState(false); // User has started the system
  const [detectionCount, setDetectionCount] = useState(0);
  const [lastDetectedTime, setLastDetectedTime] = useState(null);
  const [error, setError] = useState(null);
  const [browserSupported, setBrowserSupported] = useState(true);

  const recognitionRef = useRef(null);
  const restartTimerRef = useRef(null);
  const retryCountRef = useRef(0);
  const isActiveRef = useRef(false); // Ref to track active state for callbacks
  const lastDetectionTimeRef = useRef(0); // Track last detection time for debounce
  const maxRetries = 3;
  const restartInterval = 30000; // Restart every 30 seconds to avoid browser timeout
  const debounceInterval = 3000; // Debounce detection for 3 seconds

  // Debug log helper
  const debugLog = useCallback((message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    if (data) {
      console.log(`[WakeWord ${timestamp}] ${message}`, data);
    } else {
      console.log(`[WakeWord ${timestamp}] ${message}`);
    }
  }, []);

  // Initialize Speech Recognition
  const initializeSpeechRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      debugLog('ERROR: Speech Recognition not supported in this browser');
      setBrowserSupported(false);
      setError('Speech Recognition is not supported in your browser. Please try Chrome, Edge, or Safari.');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Keep listening
    recognition.interimResults = true; // Get interim results
    recognition.lang = 'en-US'; // Set language
    recognition.maxAlternatives = 1;

    return recognition;
  }, [debugLog]);

  // Check if transcript contains wake word
  const checkForWakeWord = useCallback((transcript) => {
    const normalizedTranscript = transcript.toLowerCase().trim();
    const wakeWords = ['hey piatto', 'hey piato', 'hi piatto', 'hi piato', 'hey piattu', 'hi piattu', 'hey piattu', 'hey piatou', 'hey biatto', 'hey piotr', 'hey piator', 'hey piattoo', 'hey pieto']; // Include common mishearings

    return wakeWords.some(word => normalizedTranscript.includes(word));
  }, []);

  // Start listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      debugLog('Initializing Speech Recognition...');
      recognitionRef.current = initializeSpeechRecognition();

      if (!recognitionRef.current) {
        return; // Browser not supported
      }

      // Setup event handlers
      recognitionRef.current.onstart = () => {
        debugLog('✓ Started listening for "Hey Piatto"');
        setIsListening(true);
        setError(null);
        retryCountRef.current = 0; // Reset retry count on successful start
      };

      recognitionRef.current.onresult = (event) => {
        const results = event.results;
        const lastResultIndex = results.length - 1;
        const transcript = results[lastResultIndex][0].transcript;
        const isFinal = results[lastResultIndex].isFinal;

        debugLog(`Heard: "${transcript}" (${isFinal ? 'final' : 'interim'})`);

        if (checkForWakeWord(transcript)) {
          const now = Date.now();
          const timeSinceLastDetection = now - lastDetectionTimeRef.current;

          // Check if enough time has passed since last detection (debounce)
          if (timeSinceLastDetection >= debounceInterval) {
            debugLog('🎯 WAKE WORD DETECTED! "Hey Piatto" was heard!');
            lastDetectionTimeRef.current = now;
            setDetectionCount(prev => prev + 1);
            setLastDetectedTime(new Date());

            // TODO: Add callback here to trigger audio streaming to backend
          } else {
            const remainingTime = Math.ceil((debounceInterval - timeSinceLastDetection) / 1000);
            debugLog(`⏳ Wake word heard but debounced (wait ${remainingTime}s)`);
          }
        }
      };

      recognitionRef.current.onerror = (event) => {
        debugLog('ERROR occurred:', event.error);

        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setError('Microphone permission denied. Please allow microphone access and try again.');
          setIsActive(false);
          isActiveRef.current = false;
          setIsListening(false);
          debugLog('Microphone permission denied - stopping');
        } else if (event.error === 'audio-capture') {
          setError('Microphone access error. Please check your browser settings and reload the page. Make sure your microphone is not being used by another application.');
          setIsActive(false);
          isActiveRef.current = false;
          setIsListening(false);
          debugLog('Audio capture error - microphone might be in use or blocked by browser policy');
        } else if (event.error === 'no-speech') {
          debugLog('No speech detected, will auto-restart...');
          // This is normal, don't show error to user
        } else if (event.error === 'network') {
          debugLog('Network error occurred');
          setError('Network error. Please check your connection.');
        } else {
          debugLog(`Unhandled error: ${event.error}`);
          setError(`Error: ${event.error}`);
        }
      };

      recognitionRef.current.onend = () => {
        debugLog('Recognition ended');
        setIsListening(false);

        // Auto-restart if still active and not at max retries
        if (isActiveRef.current && retryCountRef.current < maxRetries) {
          debugLog(`Auto-restarting (attempt ${retryCountRef.current + 1}/${maxRetries})...`);
          retryCountRef.current += 1;

          setTimeout(() => {
            if (isActiveRef.current) {
              try {
                recognitionRef.current?.start();
              } catch (err) {
                debugLog('Error restarting:', err.message);
              }
            }
          }, 500); // Small delay before restart
        } else if (retryCountRef.current >= maxRetries) {
          debugLog('Max retries reached');
          setError('Connection lost. Please restart listening.');
        }
      };
    }

    // Start recognition
    try {
      debugLog('Starting recognition...');
      recognitionRef.current.start();
    } catch (err) {
      if (err.name === 'InvalidStateError') {
        debugLog('Already running, ignoring start request');
      } else {
        debugLog('Error starting recognition:', err.message);
        setError(`Failed to start: ${err.message}`);
      }
    }
  }, [initializeSpeechRecognition, checkForWakeWord, debugLog]);

  // Stop listening
  const stopListening = useCallback(() => {
    debugLog('Stopping listening...');

    if (restartTimerRef.current) {
      clearInterval(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        debugLog('Error stopping recognition:', err.message);
      }
      recognitionRef.current = null;
    }

    setIsListening(false);
    setIsActive(false);
    isActiveRef.current = false;
    retryCountRef.current = 0;
    debugLog('✓ Stopped listening');
  }, [debugLog]);

  // Setup auto-restart timer
  useEffect(() => {
    if (isActive && isListening) {
      debugLog(`Setting up auto-restart timer (${restartInterval / 1000}s)`);

      restartTimerRef.current = setInterval(() => {
        debugLog('Auto-restart timer triggered - restarting recognition');

        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
            // Will auto-restart via onend handler
          } catch (err) {
            debugLog('Error during auto-restart:', err.message);
          }
        }
      }, restartInterval);

      return () => {
        if (restartTimerRef.current) {
          clearInterval(restartTimerRef.current);
          restartTimerRef.current = null;
        }
      };
    }
  }, [isActive, isListening, debugLog]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debugLog('Component unmounting - cleaning up');
      stopListening();
    };
  }, [stopListening, debugLog]);

  // Start/Stop control
  const toggleListening = useCallback(() => {
    if (isActive) {
      stopListening();
    } else {
      setIsActive(true);
      isActiveRef.current = true;
      setError(null);
      retryCountRef.current = 0;
      debugLog('=== STARTING WAKE WORD DETECTION ===');
      startListening();
    }
  }, [isActive, startListening, stopListening, debugLog]);

  return {
    isListening,
    isActive,
    detectionCount,
    lastDetectedTime,
    error,
    browserSupported,
    toggleListening,
  };
};

export default useWakeWordDetection;
