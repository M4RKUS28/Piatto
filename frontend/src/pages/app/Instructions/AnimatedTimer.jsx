import React from 'react';
import { useTimer } from 'react-timer-hook';
import { PiX, PiPlay, PiPause, PiArrowClockwise } from 'react-icons/pi';

const AnimatedTimer = ({
  stepIndex,
  heading,
  timerSeconds,
  isFloating = false,
  isExpanded = true,
  onStartFloating,
  onReturnToStep,
  onExpand,
  timerRef
}) => {
  const time = new Date();
  time.setSeconds(time.getSeconds() + timerSeconds);

  const {
    seconds,
    minutes,
    hours,
    isRunning,
    pause,
    resume,
    restart,
  } = useTimer({
    expiryTimestamp: time,
    autoStart: isFloating && isExpanded, // Auto-start when floating and expanded
    onExpire: () => console.warn('Timer expired'),
  });

  const handleReset = () => {
    const newTime = new Date();
    newTime.setSeconds(newTime.getSeconds() + timerSeconds);
    restart(newTime, false);
  };

  const handleStart = () => {
    if (!isRunning) {
      if (!isFloating) {
        // Start floating animation - the floating timer will auto-start
        onStartFloating(stepIndex);
      } else {
        // If already floating, just resume
        resume();
      }
    }
  };

  const handlePause = () => {
    pause();
  };

  const handleClose = () => {
    handleReset();
    onReturnToStep(stepIndex);
  };

  // Format time with leading zeros
  const formatTime = (value) => String(value).padStart(2, '0');

  // Collapsed floating view (just the heading bar)
  if (isFloating && !isExpanded) {
    const borderColor = isRunning ? 'border-green-500' : 'border-orange-400';

    return (
      <div
        ref={timerRef}
        onClick={onExpand}
        className={`bg-white bg-opacity-90 rounded-lg shadow-sm border-2 ${borderColor} p-2.5 cursor-pointer hover:bg-opacity-100 transition-all duration-200`}
      >
        <div className="flex items-center justify-between">
          <h4 className="text-xs sm:text-sm font-medium text-[#2D2D2D] flex-1 truncate opacity-80">
            {heading}
          </h4>
          <div className="text-xs font-mono text-[#2D2D2D] opacity-60 ml-2">
            {hours > 0 && <span>{formatTime(hours)}:</span>}
            <span>{formatTime(minutes)}</span>
            <span>:</span>
            <span>{formatTime(seconds)}</span>
          </div>
        </div>
      </div>
    );
  }

  // Expanded floating view
  if (isFloating && isExpanded) {
    const borderColor = isRunning ? 'border-green-500' : 'border-orange-400';

    return (
      <div
        ref={timerRef}
        className={`bg-white bg-opacity-95 rounded-lg shadow-md border-2 ${borderColor} p-3 sm:p-4 transition-all duration-300`}
      >
        {/* Header with title and close button */}
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-sm sm:text-base font-semibold text-[#2D2D2D] flex-1 pr-2 leading-tight">
            {heading}
          </h4>
          <button
            onClick={handleClose}
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-[#FF9B7B] hover:bg-[#FFF8F0] rounded transition-colors"
            aria-label="Return to step"
          >
            <PiX className="text-sm" />
          </button>
        </div>

        {/* Timer display and controls */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* Time Display */}
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-[#2D2D2D] font-mono tracking-wide">
            {hours > 0 && <span>{formatTime(hours)}:</span>}
            <span>{formatTime(minutes)}</span>
            <span>:</span>
            <span>{formatTime(seconds)}</span>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-1 sm:gap-2">
            <button
              onClick={handleStart}
              disabled={isRunning}
              className={`
                w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center
                transition-all duration-200
                ${isRunning
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-[#035035] text-white hover:bg-[#024028] hover:scale-105 active:scale-95'
                }
              `}
              aria-label="Start"
            >
              <PiPlay className="text-sm sm:text-base" />
            </button>

            <button
              onClick={handlePause}
              disabled={!isRunning}
              className={`
                w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center
                transition-all duration-200
                ${!isRunning
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-[#FF9B7B] text-white hover:bg-[#FF8B6B] hover:scale-105 active:scale-95'
                }
              `}
              aria-label="Pause"
            >
              <PiPause className="text-sm sm:text-base" />
            </button>

            <button
              onClick={handleReset}
              className="
                w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center
                transition-all duration-200
                bg-white text-[#FF9B7B] hover:bg-[#FFF8F0] hover:scale-105 active:scale-95
                border-2 border-[#FF9B7B]
              "
              aria-label="Reset"
            >
              <PiArrowClockwise className="text-sm sm:text-base" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Inline view (in step div)
  return (
    <div ref={timerRef} className="mt-4 bg-white p-4 sm:p-5 rounded-xl border-2 border-[#FF9B7B] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 transition-opacity duration-300">
      {/* Time Display - Left Side (or Top on mobile) */}
      <div className="flex flex-col">
        <div className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2D2D2D] font-mono tracking-wide">
          {hours > 0 && <span>{formatTime(hours)}:</span>}
          <span>{formatTime(minutes)}</span>
          <span>:</span>
          <span>{formatTime(seconds)}</span>
        </div>
        <div className="mt-1 text-xs text-[#FF9B7B] font-medium uppercase tracking-wide">
          {isRunning ? '⏱ Running' : '⏸ Paused'}
        </div>
      </div>

      {/* Buttons - Right Side (or Bottom on mobile) */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleStart}
          disabled={isRunning}
          className={`
            px-3 sm:px-4 py-2 rounded-lg font-medium text-xs uppercase tracking-wide
            transition-all duration-200 flex-1 sm:flex-none
            ${isRunning
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-[#035035] text-white hover:bg-[#024028] hover:scale-105 active:scale-95'
            }
          `}
        >
          ▶ Start
        </button>

        <button
          onClick={handlePause}
          disabled={!isRunning}
          className={`
            px-3 sm:px-4 py-2 rounded-lg font-medium text-xs uppercase tracking-wide
            transition-all duration-200 flex-1 sm:flex-none
            ${!isRunning
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-[#FF9B7B] text-white hover:bg-[#FF8B6B] hover:scale-105 active:scale-95'
            }
          `}
        >
          ⏸ Pause
        </button>

        <button
          onClick={handleReset}
          className="
            px-3 sm:px-4 py-2 rounded-lg font-medium text-xs uppercase tracking-wide
            transition-all duration-200 flex-1 sm:flex-none
            bg-white text-[#FF9B7B] hover:bg-[#FFF8F0] hover:scale-105 active:scale-95
            border-2 border-[#FF9B7B]
          "
        >
          ↺ Reset
        </button>
      </div>
    </div>
  );
};

export default AnimatedTimer;
