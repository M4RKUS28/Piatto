import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for detecting wake word "Hey Piatto" using Web Speech API
 * Auto-restarts listening every 55 seconds to prevent browser timeout
 * Handles audio streaming to backend via WebSocket for voice assistant
 */
const useWakeWordDetection = (cookingSessionId = null) => {
  const [isListening, setIsListening] = useState(false);
  const [isActive, setIsActive] = useState(false); // User has started the system
  const [detectionCount, setDetectionCount] = useState(0);
  const [lastDetectedTime, setLastDetectedTime] = useState(null);
  const [error, setError] = useState(null);
  const [browserSupported, setBrowserSupported] = useState(true);

  // New states for voice assistant
  const [assistantState, setAssistantState] = useState('idle'); // 'idle', 'detected', 'listening', 'processing', 'playing'
  const [isRecording, setIsRecording] = useState(false);

  const recognitionRef = useRef(null);
  const restartTimerRef = useRef(null);
  const retryCountRef = useRef(0);
  const isActiveRef = useRef(false); // Ref to track active state for callbacks
  const lastDetectionTimeRef = useRef(0); // Track last detection time for debounce
  const maxRetries = 3;
  const restartInterval = 30000; // Restart every 30 seconds to avoid browser timeout
  const debounceInterval = 3000; // Debounce detection for 3 seconds

  // New refs for voice assistant
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const websocketRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioElementRef = useRef(null);
  const recordingTimeoutRef = useRef(null);
  const maxRecordingTime = 30000; // Maximum 30 seconds recording

  // Debug log helper
  const debugLog = useCallback((message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    if (data) {
      console.log(`[WakeWord ${timestamp}] ${message}`, data);
    } else {
      console.log(`[WakeWord ${timestamp}] ${message}`);
    }
  }, []);

  // Setup WebSocket connection
  const setupWebSocket = useCallback(() => {
    if (!cookingSessionId) {
      debugLog('ERROR: No cooking session ID provided for WebSocket');
      setError('No active cooking session');
      return null;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:${window.location.port || (protocol === 'wss:' ? '443' : '80')}/ws/voice_assistant?session_id=${cookingSessionId}`;

    debugLog('Connecting to WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      debugLog('✓ WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        debugLog('WebSocket message received:', data);

        if (data.type === 'stop_recording') {
          debugLog('Server VAD detected silence - stopping recording');
          stopRecording();
        } else if (data.type === 'processing') {
          debugLog('Server is processing audio');
          setAssistantState('processing');
        } else if (data.type === 'error') {
          debugLog('Server error:', data.message);
          setError(data.message);
          setAssistantState('idle');
          stopRecording();
        }
      } catch (err) {
        // If not JSON, might be binary audio data
        if (event.data instanceof Blob) {
          debugLog('Received audio response blob');
          playAudioResponse(event.data);
        } else {
          debugLog('Unknown WebSocket message format');
        }
      }
    };

    ws.onerror = (error) => {
      debugLog('WebSocket error:', error);
      setError('WebSocket connection error');
      setAssistantState('idle');
    };

    ws.onclose = () => {
      debugLog('WebSocket closed');
      if (assistantState !== 'idle') {
        setAssistantState('idle');
      }
    };

    return ws;
  }, [cookingSessionId, assistantState, debugLog]);

  // Play audio response
  const playAudioResponse = useCallback(async (audioBlob) => {
    try {
      debugLog('Playing audio response');
      setAssistantState('playing');

      const audioUrl = URL.createObjectURL(audioBlob);

      if (!audioElementRef.current) {
        audioElementRef.current = new Audio();
      }

      audioElementRef.current.src = audioUrl;

      audioElementRef.current.onended = () => {
        debugLog('Audio playback finished');
        setAssistantState('idle');
        URL.revokeObjectURL(audioUrl);

        // Close WebSocket after playback
        if (websocketRef.current) {
          websocketRef.current.close();
          websocketRef.current = null;
        }
      };

      audioElementRef.current.onerror = (err) => {
        debugLog('Audio playback error:', err);
        setError('Failed to play audio response');
        setAssistantState('idle');
        URL.revokeObjectURL(audioUrl);
      };

      await audioElementRef.current.play();
    } catch (err) {
      debugLog('Error playing audio:', err.message);
      setError('Failed to play audio response');
      setAssistantState('idle');
    }
  }, [debugLog]);

  // Start recording audio
  const startRecording = useCallback(async () => {
    try {
      debugLog('Starting audio recording...');
      setAssistantState('detected');

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Initialize MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Setup WebSocket
      const ws = setupWebSocket();
      if (!ws) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      websocketRef.current = ws;

      // Wait for WebSocket to open
      ws.addEventListener('open', () => {
        debugLog('WebSocket ready, starting MediaRecorder');

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            debugLog(`Audio chunk received: ${event.data.size} bytes`);
            audioChunksRef.current.push(event.data);

            // Send chunk via WebSocket
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(event.data);
            }
          }
        };

        mediaRecorder.onstop = () => {
          debugLog('MediaRecorder stopped');
          stream.getTracks().forEach(track => track.stop());
          setIsRecording(false);
        };

        mediaRecorder.onerror = (error) => {
          debugLog('MediaRecorder error:', error);
          setError('Recording error occurred');
          setAssistantState('idle');
        };

        // Start recording
        mediaRecorder.start(100); // Collect 100ms chunks
        setIsRecording(true);
        setAssistantState('listening');
        debugLog('✓ Recording started');

        // Set maximum recording timeout
        recordingTimeoutRef.current = setTimeout(() => {
          debugLog('Max recording time reached');
          stopRecording();
        }, maxRecordingTime);
      });

    } catch (err) {
      debugLog('Error starting recording:', err.message);
      setError('Failed to access microphone');
      setAssistantState('idle');
    }
  }, [setupWebSocket, debugLog]);

  // Stop recording audio
  const stopRecording = useCallback(() => {
    debugLog('Stopping recording...');

    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Signal to server that recording is complete
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({ type: 'recording_complete' }));
      setAssistantState('processing');
    }
  }, [debugLog]);

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

            // Trigger audio recording and streaming
            if (cookingSessionId && assistantState === 'idle') {
              debugLog('Starting voice assistant conversation...');
              startRecording();
            } else if (!cookingSessionId) {
              debugLog('WARNING: No cooking session ID, skipping voice assistant');
            } else if (assistantState !== 'idle') {
              debugLog(`Assistant busy (state: ${assistantState}), ignoring wake word`);
            }
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

  // Cleanup WebSocket and audio on unmount or when stopping
  useEffect(() => {
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
        websocketRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
    };
  }, []);

  return {
    isListening,
    isActive,
    detectionCount,
    lastDetectedTime,
    error,
    browserSupported,
    toggleListening,
    startListening,
    stopListening,
    // New voice assistant states
    assistantState, // 'idle', 'detected', 'listening', 'processing', 'playing'
    isRecording,
  };
};

export default useWakeWordDetection;
