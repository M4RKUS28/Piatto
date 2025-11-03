import React from 'react';
import { motion } from 'framer-motion';

/**
 * A subtle progress bar that appears in a step when its timer is running
 * Shows the current progress of the floating timer
 */
const TimerProgressBar = ({ currentSeconds, totalSeconds, isRunning }) => {
  // Calculate progress percentage (0-100)
  const progress = totalSeconds > 0
    ? Math.max(0, Math.min(100, ((totalSeconds - currentSeconds) / totalSeconds) * 100))
    : 0;

  // Color based on running state
  const barColor = isRunning ? 'bg-green-500' : 'bg-orange-400';
  const glowColor = isRunning ? 'shadow-green-500/30' : 'shadow-orange-400/30';

  return (
    <div className="mt-3 w-full">
      {/* Progress bar container */}
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden relative">
        {/* Animated progress bar */}
        <motion.div
          className={`h-full ${barColor} ${glowColor} shadow-sm rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{
            duration: 0.3,
            ease: 'easeOut'
          }}
        />

        {/* Subtle pulse animation when running */}
        {isRunning && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        )}
      </div>

      {/* Timer status text */}
      <div className="mt-1.5 flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1">
          {isRunning ? (
            <>
              <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Timer running
            </>
          ) : (
            <>
              <span className="inline-block w-1.5 h-1.5 bg-orange-400 rounded-full" />
              Timer paused
            </>
          )}
        </span>
        <span className="font-mono tabular-nums opacity-60">
          {Math.floor(progress)}%
        </span>
      </div>
    </div>
  );
};

export default TimerProgressBar;
