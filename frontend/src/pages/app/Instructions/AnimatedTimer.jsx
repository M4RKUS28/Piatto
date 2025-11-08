import React from 'react';
import { useTimer } from 'react-timer-hook';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { PiX, PiPlay, PiPause, PiArrowClockwise } from 'react-icons/pi';

const AnimatedTimer = ({
  stepIndex,
  heading,
  timerSeconds,
  isFloating = false,
  isExpanded = true,
  isAnimating = false,
  onStartFloating,
  onReturnToStep,
  onExpand,
  timerRef,
  onTimerUpdate // Callback to report timer state to parent
}) => {
  const { t } = useTranslation('instructions');
  const audioContextRef = React.useRef(null);

  const playTimerCompleteSound = React.useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) {
      return;
    }

    try {
      const context = audioContextRef.current ?? new AudioContextConstructor();
      audioContextRef.current = context;

      if (context.state === 'suspended') {
        context.resume().catch(() => {});
      }

      const now = context.currentTime;

      const scheduleTone = (frequency, startOffset, duration, gainPeak) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(frequency, now + startOffset);

        gain.gain.setValueAtTime(0.0001, now + startOffset);
        gain.gain.exponentialRampToValueAtTime(gainPeak, now + startOffset + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.start(now + startOffset);
        oscillator.stop(now + startOffset + duration + 0.05);

        oscillator.onended = () => {
          oscillator.disconnect();
          gain.disconnect();
        };
      };

      scheduleTone(880, 0, 0.35, 0.22);
      scheduleTone(990, 0.25, 0.35, 0.28);
      scheduleTone(1175, 0.5, 0.4, 0.32);
    } catch (error) {
      console.warn('Timer completion sound failed:', error);
    }
  }, []);

  React.useEffect(() => () => {
    if (audioContextRef.current && typeof audioContextRef.current.close === 'function') {
      audioContextRef.current.close();
    }
    audioContextRef.current = null;
  }, []);

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
    onExpire: () => {
      playTimerCompleteSound();
    },
  });

  // Report timer state to parent component
  React.useEffect(() => {
    if (onTimerUpdate) {
      const totalCurrentSeconds = hours * 3600 + minutes * 60 + seconds;
      onTimerUpdate(stepIndex, {
        currentSeconds: totalCurrentSeconds,
        totalSeconds: timerSeconds,
        isRunning,
        hours,
        minutes,
        seconds
      });
    }
  }, [seconds, minutes, hours, isRunning, onTimerUpdate, stepIndex, timerSeconds]);

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
          <motion.h4
            className="text-xs sm:text-sm font-medium text-[#2D2D2D] flex-1 truncate opacity-80"
            initial={{ opacity: 0 }}
            animate={{ opacity: isAnimating ? 1 : 0.8 }}
            transition={{ duration: 0.6 }}
          >
            {heading}
          </motion.h4>
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
          <motion.h4
            className="text-sm sm:text-base font-semibold text-[#2D2D2D] flex-1 pr-2 leading-tight"
            initial={{ opacity: 0 }}
            animate={{ opacity: isAnimating ? 1 : 1 }}
            transition={{ duration: 0.6 }}
          >
            {heading}
          </motion.h4>
          <button
            onClick={handleClose}
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-[#FF9B7B] hover:bg-[#FFF8F0] rounded transition-colors"
            aria-label={t('timer.aria.returnToStep', 'Return to step')}
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
              aria-label={t('timer.aria.start', 'Start')}
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
              aria-label={t('timer.aria.pause', 'Pause')}
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
              aria-label={t('timer.aria.reset', 'Reset')}
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
    <div ref={timerRef} className="mt-4 bg-white p-4 sm:p-5 rounded-xl border-2 border-[#FF9B7B] flex flex-col gap-3 transition-opacity duration-300">
      {/* Heading - only rendered during animation */}
      {isAnimating && (
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: 'auto', marginBottom: '0.5rem' }}
          transition={{ duration: 0.6 }}
          style={{ overflow: 'hidden' }}
        >
          <h4 className="text-sm sm:text-base font-semibold text-[#2D2D2D] flex-1 pr-2 leading-tight">
            {heading}
          </h4>
        </motion.div>
      )}

      {/* Timer and Controls Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        {/* Time Display - Left Side (or Top on mobile) */}
        <div className="flex flex-col">
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2D2D2D] font-mono tracking-wide">
            {hours > 0 && <span>{formatTime(hours)}:</span>}
            <span>{formatTime(minutes)}</span>
            <span>:</span>
            <span>{formatTime(seconds)}</span>
          </div>
          <motion.div
            className="mt-1 text-xs text-[#FF9B7B] font-medium uppercase tracking-wide"
            initial={{ opacity: 1 }}
            animate={{ opacity: isAnimating ? 0 : 1 }}
            transition={{ duration: 0.6 }}
          >
            {isRunning ? `⏱ ${t('timer.running', 'Running')}` : `⏸ ${t('timer.paused', 'Paused')}`}
          </motion.div>
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
            <span className="inline-flex items-center gap-1">
              <span>▶</span>
              <motion.span
                initial={{ opacity: 1 }}
                animate={{ opacity: isAnimating ? 0 : 1 }}
                transition={{ duration: 0.6 }}
              >
                {t('timer.start', 'Start')}
              </motion.span>
            </span>
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
            <span className="inline-flex items-center gap-1">
              <span>⏸</span>
              <motion.span
                initial={{ opacity: 1 }}
                animate={{ opacity: isAnimating ? 0 : 1 }}
                transition={{ duration: 0.6 }}
              >
                {t('timer.pause', 'Pause')}
              </motion.span>
            </span>
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
            <span className="inline-flex items-center gap-1">
              <span>↺</span>
              <motion.span
                initial={{ opacity: 1 }}
                animate={{ opacity: isAnimating ? 0 : 1 }}
                transition={{ duration: 0.6 }}
              >
                {t('timer.reset', 'Reset')}
              </motion.span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnimatedTimer;
