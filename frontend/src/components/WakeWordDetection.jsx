import React from 'react';
import useWakeWordDetectionPorcupine from '../hooks/useWakeWordDetectionPorcupine';

/**
 * Visual component for Wake Word Detection using Porcupine
 * Shows listening status, controls, and detection feedback
 */
const WakeWordDetection = () => {
  const {
    isListening,
    isActive,
    isLoading,
    detectionCount,
    lastDetectedTime,
    error,
    browserSupported,
    toggleListening,
  } = useWakeWordDetectionPorcupine();

  // Don't render if browser doesn't support required features
  if (!browserSupported) {
    return (
      <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <h3 className="font-semibold text-red-800 text-sm">Browser Not Supported</h3>
            <p className="text-xs text-red-600 mt-1">
              Your browser doesn't support the required audio features. Please use a modern browser (Chrome, Edge, Firefox, or Safari).
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-[#A8C9B8] rounded-xl p-4 sm:p-5 mb-6 shadow-sm">
      {/* Header with Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🎤</div>
          <div>
            <h3 className="font-semibold text-[#2D2D2D] text-sm sm:text-base">
              Voice Wake Word Detection
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              Listening for: "Hey Piatto"
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-spin border-2 border-transparent border-t-blue-500" />
              <span className="text-xs font-medium text-blue-700">Loading...</span>
            </div>
          )}
          {isListening && !isLoading && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-green-700">Listening</span>
            </div>
          )}
          {isActive && !isListening && !isLoading && (
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 rounded-full">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span className="text-xs font-medium text-yellow-700">Initializing...</span>
            </div>
          )}
        </div>
      </div>

      {/* Control Button */}
      <div className="mb-4">
        <button
          onClick={toggleListening}
          disabled={isLoading}
          className={`
            w-full sm:w-auto px-6 py-3 rounded-lg font-medium text-sm uppercase tracking-wide
            transition-all duration-200
            ${isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : isActive
                ? 'bg-red-500 text-white hover:bg-red-600 hover:scale-105 active:scale-95'
                : 'bg-[#035035] text-white hover:bg-[#024028] hover:scale-105 active:scale-95'
            }
          `}
        >
          {isLoading ? '⏳ Loading...' : isActive ? '⏹ Stop Listening' : '▶ Start Listening'}
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

      {/* Detection Feedback - Simple visual indicator */}
      {lastDetectedTime && (
        <div className="p-3 bg-green-50 border-2 border-green-300 rounded-lg animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-800">
                Wake word detected!
              </p>
              <p className="text-xs text-green-600 mt-1">
                Last detected: {lastDetectedTime.toLocaleTimeString()}
                {detectionCount > 1 && ` (${detectionCount} times total)`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Debug Info */}
      {isActive && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            💡 Debug: Check browser console for detailed logs. Using Porcupine deep learning model for accurate wake word detection.
          </p>
        </div>
      )}
    </div>
  );
};

export default WakeWordDetection;
