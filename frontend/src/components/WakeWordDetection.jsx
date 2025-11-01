import React, { useEffect, useState } from 'react';
import useHeyPiattoDetection from '../hooks/useHeyPiattoDetection';
import { Trans, useTranslation } from 'react-i18next';

/**
 * Visual component for Custom "Hey Piatto" Wake Word Detection
 * Uses trained ONNX model with meyda and onnxruntime-web
 */
const WakeWordDetection = () => {
  const { t } = useTranslation(['common', 'errors']);
  const {
    detected,
    confidence,
    isListening,
    startListening,
    stopListening
  } = useHeyPiattoDetection();

  const [detectionCount, setDetectionCount] = useState(0);
  const [lastDetectedTime, setLastDetectedTime] = useState(null);
  const [error, setError] = useState(null);

  // Handle wake word detection
  useEffect(() => {
    if (detected) {
      console.log('🎯 HEY PIATTO DETECTED! Confidence:', (confidence * 100).toFixed(1) + '%');
      setDetectionCount(prev => prev + 1);
      setLastDetectedTime(new Date());
      setError(null);

      // TODO: Add callback here to trigger audio streaming to backend
      // Example: startAudioStreamingToBackend();
    }
  }, [detected, confidence]);

  // Handle start listening with error handling
  const handleStart = async () => {
    try {
      setError(null);
      await startListening();
    } catch (err) {
      console.error('Error starting wake word detection:', err);

      // Check for specific error types
      if (err.name === 'NotAllowedError') {
        setError(
          t('errors:wakeWord.micPermissionDenied', {
            defaultValue: 'Microphone permission denied. Please allow microphone access and try again.',
          }),
        );
      } else if (err.name === 'NotFoundError') {
        setError(
          t('errors:wakeWord.noMicrophone', {
            defaultValue: 'No microphone found. Please connect a microphone and try again.',
          }),
        );
      } else if (err.message?.includes('no available backend') || err.message?.includes('initWasm() failed')) {
        setError(
          t('errors:wakeWord.onnxLoadFailed', {
            defaultValue:
              'Failed to load ONNX Runtime. This might be due to: (1) No internet connection to load WASM files from CDN, or (2) Browser restrictions. Try refreshing the page or check your internet connection.',
          }),
        );
      } else if (err.message?.includes('protobuf') || err.message?.includes('ERROR_CODE: 7')) {
        setError(
          t('errors:wakeWord.modelNotFound', {
            defaultValue:
              'Wake word model not found! You need to train your custom "Hey Piatto" model first. See the setup instructions below or check QUICK_START.md for training steps.',
          }),
        );
      } else if (err.message?.includes('model') || err.message?.includes('onnx')) {
        setError(
          t('errors:wakeWord.modelLoadFailed', {
            defaultValue:
              'Failed to load wake word model. Make sure wakeword_model.onnx is in the public folder. See CUSTOM_WAKE_WORD_TRAINING.md for setup.',
          }),
        );
      } else if (err.message?.includes('wasm') || err.message?.includes('backend') || err.message?.includes('dynamically imported module')) {
        setError(
          t('errors:wakeWord.wasmFailed', {
            defaultValue:
              'WebAssembly loading failed. Please refresh the page. If this persists, check your internet connection (WASM files load from CDN).',
          }),
        );
      } else {
        setError(
          t('errors:wakeWord.startFailed', {
            message: err.message ||
              t('common:wakeWord.messages.unknownError', {
                defaultValue: 'Unknown error',
              }),
            defaultValue: 'Failed to start: {{message}}. Check browser console for details.',
          }),
        );
      }
    }
  };

  // Handle stop listening
  const handleStop = () => {
    stopListening();
    setError(null);
  };

  return (
    <div className="bg-white border-2 border-[#A8C9B8] rounded-xl p-4 sm:p-5 mb-6 shadow-sm">
      {/* Header with Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🎤</div>
          <div>
            <h3 className="font-semibold text-[#2D2D2D] text-sm sm:text-base">
              {t('common:wakeWord.headerTitle', {
                defaultValue: 'Custom Wake Word Detection',
              })}
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              {t('common:wakeWord.headerSubtitle', {
                phrase: 'Hey Piatto',
                defaultValue: 'Listening for: "{{phrase}}"',
              })}
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {isListening && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-green-700">
                {t('common:wakeWord.statusListening', {
                  defaultValue: 'Listening',
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Control Button */}
      <div className="mb-4">
        <button
          onClick={isListening ? handleStop : handleStart}
          className={`
            w-full sm:w-auto px-6 py-3 rounded-lg font-medium text-sm uppercase tracking-wide
            transition-all duration-200 hover:scale-105 active:scale-95
            ${isListening
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-[#035035] text-white hover:bg-[#024028]'
            }
          `}
        >
          {isListening
            ? t('common:wakeWord.controls.stop', {
                defaultValue: '⏹ Stop Listening',
              })
            : t('common:wakeWord.controls.start', {
                defaultValue: '▶ Start Listening',
              })}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-red-500 text-sm">⚠️</span>
            <p className="text-xs text-red-700 flex-1">{error}</p>
          </div>
        </div>
      )}

      {/* Detection Feedback */}
      {detected && lastDetectedTime && (
        <div className="mb-4 p-3 bg-green-50 border-2 border-green-300 rounded-lg animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-800">
                {t('common:wakeWord.feedback.detected', {
                  phrase: 'Hey Piatto',
                  defaultValue: '"{{phrase}}" detected!',
                })}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {t('common:wakeWord.feedback.confidence', {
                  value: (confidence * 100).toFixed(1),
                  defaultValue: 'Confidence: {{value}}%',
                })}
                {' • '}
                {lastDetectedTime.toLocaleTimeString()}
                {detectionCount > 1 && (
                  <>
                    {' • '}
                    {t('common:wakeWord.feedback.total', {
                      count: detectionCount,
                      defaultValue: 'Total: {{count}}',
                    })}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Setup Warning */}
      {!isListening && !error && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-blue-500 text-sm">ℹ️</span>
            <div className="flex-1 text-xs text-blue-700">
              <p className="font-semibold mb-1">
                {t('common:wakeWord.setup.title', {
                  defaultValue: 'First time setup required:',
                })}
              </p>
              <ol className="list-decimal ml-4 space-y-1">
                <li>
                  {t('common:wakeWord.setup.step1', {
                    phrase: 'Hey Piatto',
                    defaultValue:
                      'Train your custom "{{phrase}}" model (see CUSTOM_WAKE_WORD_TRAINING.md)',
                  })}
                </li>
                <li>
                  <Trans
                    i18nKey="common:wakeWord.setup.step2"
                    values={{ file: 'wakeword_model.onnx', folder: 'frontend/public/' }}
                    components={{
                      code: <code className="bg-blue-100 px-1 rounded" />,
                    }}
                    defaults="Place <code>{{file}}</code> in <code>{{folder}}</code>"
                  />
                </li>
                <li>
                  {t('common:wakeWord.setup.step3', {
                    defaultValue: 'Click "Start Listening" to begin detection',
                  })}
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Debug Info */}
      {isListening && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            {t('common:wakeWord.debug.description', {
              phrase: 'Hey Piatto',
              defaultValue: '💡 Using custom-trained ONNX model for "{{phrase}}" detection.',
            })}
            {confidence > 0 && (
              <>
                {' '}
                {t('common:wakeWord.debug.currentConfidence', {
                  value: (confidence * 100).toFixed(1),
                  defaultValue: 'Current confidence: {{value}}%',
                })}
              </>
            )}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {t('common:wakeWord.debug.logs', {
              defaultValue: 'Check browser console for detailed detection logs.',
            })}
          </p>
        </div>
      )}
    </div>
  );
};

export default WakeWordDetection;
