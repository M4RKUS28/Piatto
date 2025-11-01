import React from 'react';
import useWakeWordDetection from '../hooks/useWakeWordDetection';

/**
 * Visual component for Wake Word Detection
 * Shows listening status, controls, and detection feedback
 */
const WakeWordDetection = () => {
  const {
    isListening,
    isActive,
    detectionCount,
    lastDetectedTime,
    error,
    browserSupported,
    toggleListening,
  } = useWakeWordDetection();

  // Don't render if browser doesn't support speech recognition
  if (!browserSupported) {
    return (
      <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <h3 className="font-semibold text-red-800 text-sm">Speech Recognition Not Supported</h3>
            <p className="text-xs text-red-600 mt-1">
              Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari.
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
          {isListening && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-green-700">Listening</span>
            </div>
          )}
          {isActive && !isListening && (
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 rounded-full">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span className="text-xs font-medium text-yellow-700">Restarting...</span>
            </div>
          )}
        </div>
      </div>

      {/* Control Button */}
      <div className="mb-4">
        <button
          onClick={toggleListening}
          className={`
            w-full sm:w-auto px-6 py-3 rounded-lg font-medium text-sm uppercase tracking-wide
            transition-all duration-200 hover:scale-105 active:scale-95
            ${isActive
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-[#035035] text-white hover:bg-[#024028]'
            }
          `}
        >
          {isActive ? '⏹ Stop Listening' : '▶ Start Listening'}
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
            💡 Debug: Check browser console for detailed logs.
            Listening auto-restarts every ~55 seconds.
          </p>
        </div>
      )}
    </div>
  );
};

export default WakeWordDetection;
