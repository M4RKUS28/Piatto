import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import AnimatedTimer from './AnimatedTimer';

/**
 * Portal component that renders an animating timer element
 * This creates a timer that flies between positions using Framer Motion
 */
const AnimatingTimerPortal = ({ timers, instructions }) => {
  if (!timers || timers.length === 0) return null;

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {timers.map((timer) => {
        const {
          id,
          stepIndex,
          fromRect,
          toRect,
          isCompacting
        } = timer;

        const instruction = instructions[stepIndex];
        if (!instruction) return null;

        // Calculate the transform needed - use uniform scale based on width
        const translateX = toRect.left - fromRect.left;
        const translateY = toRect.top - fromRect.top;
        const scale = toRect.width / fromRect.width;

        return (
          <motion.div
            key={id}
            className="absolute pointer-events-none"
            style={{
              left: `${fromRect.left}px`,
              top: `${fromRect.top}px`,
              width: `${fromRect.width}px`,
              transformOrigin: 'top left',
            }}
            initial={{
              x: 0,
              y: 0,
              scale: 1,
            }}
            animate={{
              x: translateX,
              y: translateY,
              scale: scale,
            }}
            transition={{
              duration: 0.6,
              ease: [0.4, 0.0, 0.2, 1], // cubic-bezier equivalent
            }}
          >
            <div className="w-full h-full overflow-hidden">
              <AnimatedTimer
                stepIndex={stepIndex}
                heading={instruction.heading}
                timerSeconds={instruction.timer}
                isFloating={false}
                isExpanded={false}
                isAnimating={true}
                onStartFloating={() => {}}
                onReturnToStep={() => {}}
                onExpand={() => {}}
                timerRef={() => {}}
              />
            </div>
          </motion.div>
        );
      })}
    </div>,
    document.body
  );
};

export default AnimatingTimerPortal;
