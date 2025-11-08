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
  const isActiveRef = useRef(false); // Ref to track active state for callbacks
  const lastDetectionTimeRef = useRef(0); // Track last detection time for debounce
  const debounceInterval = 3000; // Debounce detection for 3 seconds

  // Refs to avoid stale closures in event handlers
  const cookingSessionIdRef = useRef(cookingSessionId);
  const assistantStateRef = useRef(assistantState);
  const startRecordingRef = useRef(null);

  useEffect(() => {
    cookingSessionIdRef.current = cookingSessionId;
    assistantStateRef.current = assistantState;
  }, [cookingSessionId, assistantState]);

  // New refs for voice assistant
  const mediaRecorderRef = useRef(null);
  const websocketRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioQueueRef = useRef([]);  // Queue for audio chunks
  const isPlayingRef = useRef(false);  // Track if currently playing audio

  // Debug log helper
  const debugLog = useCallback((message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    if (data) {
      console.log(`[WakeWord ${timestamp}] ${message}`, data);
    } else {
      console.log(`[WakeWord ${timestamp}] ${message}`);
    }
  }, []);

  // Play audio response (PCM data from Gemini) - Queue-based playback
  const playAudioResponse = useCallback(async (pcmData) => {
    try {
      // Add to queue
      audioQueueRef.current.push(pcmData);

      // If already playing, return (queue will be processed)
      if (isPlayingRef.current) {
        return;
      }

      // Start processing queue
      isPlayingRef.current = true;
      setAssistantState('playing');

      // Create single AudioContext for all chunks
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: 24000, // Gemini outputs 24kHz PCM
        });
        debugLog('Created AudioContext for playback (24kHz)');
      }

      const audioContext = audioContextRef.current;

      // Process queue
      while (audioQueueRef.current.length > 0) {
        const chunk = audioQueueRef.current.shift();

        // Convert ArrayBuffer to Int16Array
        const int16Data = new Int16Array(chunk);

        // Convert Int16 PCM to Float32 for Web Audio API
        const float32Data = new Float32Array(int16Data.length);
        for (let i = 0; i < int16Data.length; i++) {
          float32Data[i] = int16Data[i] / (int16Data[i] < 0 ? 0x8000 : 0x7FFF);
        }

        // Create AudioBuffer
        const audioBuffer = audioContext.createBuffer(1, float32Data.length, 24000);
        audioBuffer.getChannelData(0).set(float32Data);

        // Create buffer source
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);

        // Wait for this chunk to finish before playing next
        await new Promise((resolve) => {
          source.onended = resolve;
          source.start(0);
        });
      }

      // All chunks played
      debugLog('Audio playback finished - ready for next "Hey Piatto"');
      isPlayingRef.current = false;
      setAssistantState('idle');

      // Don't close WebSocket - keep it open for next question
      // Speech recognition will auto-restart via onend handler

      // Clear queue to ensure it's empty
      audioQueueRef.current = [];
    } catch (err) {
      debugLog('Error playing audio:', err.message);
      setError('Failed to play audio response');
      isPlayingRef.current = false;
      setAssistantState('idle');
    }
  }, [debugLog]);
  // Stop recording audio (called when Gemini responds or user manually stops)
  const stopRecording = useCallback(() => {
    debugLog('Stopping recording...');

    // Cleanup audio processing nodes
    if (mediaRecorderRef.current) {
      const { processor, source, stream } = mediaRecorderRef.current;

      try {
        if (processor) {
          processor.disconnect();
          processor.onaudioprocess = null;
        }
        if (source) {
          source.disconnect();
        }
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      } catch (err) {
        debugLog('Error cleaning up audio nodes:', err);
      }

      mediaRecorderRef.current = null;
    }

    // Close AudioContext
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (err) {
        debugLog('Error closing AudioContext:', err);
      }
      audioContextRef.current = null;
    }

    setIsRecording(false);
    // Don't change assistantState here - let the caller manage state transitions
    // When Gemini responds with audio, state will go directly to 'playing'

    debugLog('✓ Recording stopped (audio stream cleanup)');
  }, [debugLog]);

  // Setup WebSocket connection
  const setupWebSocket = useCallback(() => {
    if (!cookingSessionId) {
      debugLog('ERROR: No cooking session ID provided for WebSocket');
      setError('No active cooking session');
      return null;
    }

    // TEMPORARILY DISABLED FOR TESTING - TODO: Re-enable authentication
    // Get access token from cookies for authentication
    // debugLog('All cookies:', document.cookie);
    // const accessToken = getCookie('__session');
    // if (!accessToken) {
    //   debugLog('ERROR: No access token found in cookies');
    //   debugLog('Tried cookie name: __session');
    //   setError('Authentication required');
    //   return null;
    // }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:${window.location.port || (protocol === 'wss:' ? '443' : '80')}/api/ws/voice_assistant?session_id=${cookingSessionId}`;

    debugLog('Connecting to WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      debugLog('✓ WebSocket connected');
    };

    ws.onmessage = async (event) => {
      // Check if it's binary data (audio response)
      if (event.data instanceof Blob) {
        debugLog('Received audio response from Gemini - VAD detected end of speech');

        // Stop recording when first audio chunk arrives (Gemini's VAD triggered)
        if (mediaRecorderRef.current) {
          stopRecording();
        }

        // Convert Blob to ArrayBuffer for PCM processing
        const arrayBuffer = await event.data.arrayBuffer();
        playAudioResponse(arrayBuffer);
      } else if (event.data instanceof ArrayBuffer) {
        debugLog('Received audio response from Gemini - VAD detected end of speech');

        // Stop recording when first audio chunk arrives (Gemini's VAD triggered)
        if (mediaRecorderRef.current) {
          stopRecording();
        }

        playAudioResponse(event.data);
      } else {
        // Text message (control messages)
        try {
          const data = JSON.parse(event.data);
          debugLog('WebSocket message received:', data);

          if (data.type === 'processing') {
            debugLog('Server is processing audio');
            setAssistantState('processing');
          } else if (data.type === 'error') {
            debugLog('Server error:', data.message);
            setError(data.message);
            setAssistantState('idle');
            stopRecording();
          }
        } catch (err) {
          debugLog('Unknown WebSocket message format:', event.data);
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
  }, [cookingSessionId, assistantState, debugLog, playAudioResponse, stopRecording]);

  // Start recording audio
  const startRecording = useCallback(async () => {
    try {
      debugLog('Starting audio recording...');
      setAssistantState('detected');

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Setup WebSocket
      const ws = setupWebSocket();
      if (!ws) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      websocketRef.current = ws;

      // Wait for WebSocket to open
      ws.addEventListener('open', async () => {
        debugLog('WebSocket ready, setting up audio processing');

        try {
          // Create AudioContext for PCM conversion
          const audioContext = new (window.AudioContext || window.webkitAudioContext)({
            sampleRate: 16000, // Target 16kHz for Gemini
          });

          audioContextRef.current = audioContext;

          // Create MediaStreamSource
          const source = audioContext.createMediaStreamSource(stream);

          // Create ScriptProcessor for audio data extraction
          // Buffer size of 4096 samples at 16kHz = ~256ms chunks
          const processor = audioContext.createScriptProcessor(4096, 1, 1);

          processor.onaudioprocess = (e) => {
            if (!websocketRef.current || ws.readyState !== WebSocket.OPEN) {
              return;
            }

            // Get audio data (Float32Array)
            const inputData = e.inputBuffer.getChannelData(0);

            // Convert Float32 to Int16 PCM
            const pcmData = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              // Clamp to [-1, 1] and convert to 16-bit integer
              const s = Math.max(-1, Math.min(1, inputData[i]));
              pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }

            // Send PCM data to WebSocket
            try {
              ws.send(pcmData.buffer);
            } catch (err) {
              debugLog('Error sending audio chunk:', err);
            }
          };

          // Connect nodes
          source.connect(processor);
          processor.connect(audioContext.destination);

          setIsRecording(true);
          setAssistantState('listening');
          debugLog('✓ Recording started with PCM conversion (16kHz, 16-bit)');
          debugLog('💡 Gemini Live API will automatically detect when you stop speaking (VAD)');

          // Store processor for cleanup
          mediaRecorderRef.current = { processor, source, stream };

        } catch (err) {
          debugLog('Error setting up audio processing:', err);
          stream.getTracks().forEach(track => track.stop());
          setError('Failed to initialize audio processing');
          setAssistantState('idle');
        }
      });

    } catch (err) {
      debugLog('Error starting recording:', err.message);
      setError('Failed to access microphone');
      setAssistantState('idle');
    }
  }, [setupWebSocket, debugLog]);

  // Update ref to latest startRecording function
  useEffect(() => {
    startRecordingRef.current = startRecording;
  }, [startRecording]);

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
    // Activate the system when starting
    setIsActive(true);
    isActiveRef.current = true;
    setError(null);
    debugLog('=== STARTING WAKE WORD DETECTION ===');

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
            // Use refs to get current values (avoid stale closure)
            const currentSessionId = cookingSessionIdRef.current;
            const currentAssistantState = assistantStateRef.current;

            if (currentSessionId && currentAssistantState === 'idle') {
              debugLog(`Starting voice assistant conversation for session ${currentSessionId}...`);
              // Use ref to call the latest startRecording function
              if (startRecordingRef.current) {
                startRecordingRef.current();
              }
              setAssistantState('detected');
            } else if (!currentSessionId) {
              debugLog('⚠️ WARNING: No cooking session active!');
              debugLog('💡 TIP: Start a cooking session first to use the voice assistant');
              setError('Please start a cooking session first');
              // Show temporary visual feedback
              setAssistantState('detected');
              setTimeout(() => {
                setAssistantState('idle');
                setError(null);
              }, 3000);
            } else if (currentAssistantState !== 'idle') {
              debugLog(`Assistant busy (state: ${currentAssistantState}), ignoring wake word`);
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
        debugLog(`Recognition ended - isActiveRef.current = ${isActiveRef.current}`);
        setIsListening(false);

        // ALWAYS auto-restart if still active (no retry limit!)
        if (isActiveRef.current) {
          debugLog('Auto-restart condition met, scheduling restart...');
          setTimeout(() => {
            debugLog(`Inside setTimeout: isActiveRef.current = ${isActiveRef.current}, recognitionRef.current = ${recognitionRef.current ? 'exists' : 'null'}`);
            if (isActiveRef.current) {
              try {
                debugLog('🔄 Restarting wake word detection...');
                recognitionRef.current?.start();
              } catch (err) {
                if (err.name === 'InvalidStateError') {
                  debugLog('Already running, ignoring restart');
                } else {
                  debugLog('Error restarting:', err.message);
                  // Try again after longer delay
                  setTimeout(() => {
                    if (isActiveRef.current) {
                      try {
                        recognitionRef.current?.start();
                      } catch (e) {
                        debugLog('Retry failed:', e.message);
                      }
                    }
                  }, 1000);
                }
              }
            } else {
              debugLog('❌ isActiveRef became false, not restarting');
            }
          }, 100); // Very short delay for immediate restart
        } else {
          debugLog('❌ Auto-restart SKIPPED - isActiveRef.current is false');
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
    debugLog('✓ Stopped listening');
  }, [debugLog]);

  // Auto-restart is now handled in onend callback - no need for timer
  // Recognition will automatically restart whenever it stops while isActive is true

  // Cleanup on unmount ONLY (empty deps array = only on unmount)
  useEffect(() => {
    return () => {
      console.log('[WakeWord] Component unmounting - cleaning up');
      // Use isActiveRef to stop listening
      if (isActiveRef.current) {
        isActiveRef.current = false;
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (err) {
            console.log('[WakeWord] Error stopping on unmount:', err.message);
          }
          recognitionRef.current = null;
        }
      }
    };
  }, []); // Empty deps = only runs on unmount

  // Start/Stop control
  const toggleListening = useCallback(() => {
    if (isActive) {
      stopListening();
    } else {
      setIsActive(true);
      isActiveRef.current = true;
      setError(null);
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
      if (mediaRecorderRef.current) {
        const { processor, source, stream } = mediaRecorderRef.current;
        try {
          if (processor) processor.disconnect();
          if (source) source.disconnect();
          if (stream) stream.getTracks().forEach(track => track.stop());
        } catch (err) {
          // Ignore cleanup errors
        }
        mediaRecorderRef.current = null;
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (err) {
          // Ignore cleanup errors
        }
        audioContextRef.current = null;
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
    // Direct voice assistant control (skip wake word)
    startRecording,
  };
};

export default useWakeWordDetection;
