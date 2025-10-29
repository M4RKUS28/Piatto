import React from 'react';
import { createPortal } from 'react-dom';
import AnimatedTimer from './AnimatedTimer';

/**
 * Portal component that renders an animating timer element
 * This creates a timer that flies between positions
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

        // Calculate the transform needed
        const translateX = toRect.left - fromRect.left;
        const translateY = toRect.top - fromRect.top;
        const scaleX = toRect.width / fromRect.width;
        const scaleY = toRect.height / fromRect.height;

        return (
          <div
            key={id}
            className="absolute pointer-events-none"
            style={{
              left: `${fromRect.left}px`,
              top: `${fromRect.top}px`,
              width: `${fromRect.width}px`,
              height: `${fromRect.height}px`,
              transformOrigin: 'top left',
              animation: 'flyTimer 600ms cubic-bezier(0.4, 0.0, 0.2, 1) forwards',
              '--translate-x': `${translateX}px`,
              '--translate-y': `${translateY}px`,
              '--scale-x': scaleX,
              '--scale-y': scaleY,
            }}
          >
            <div className="w-full h-full overflow-hidden">
              <AnimatedTimer
                stepIndex={stepIndex}
                heading={instruction.heading}
                timerSeconds={instruction.timer}
                isFloating={isCompacting}
                isExpanded={!isCompacting}
                onStartFloating={() => {}}
                onReturnToStep={() => {}}
                onExpand={() => {}}
                timerRef={() => {}}
              />
            </div>
          </div>
        );
      })}
      <style>{`
        @keyframes flyTimer {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--translate-x), var(--translate-y)) scale(var(--scale-x), var(--scale-y));
            opacity: 1;
          }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default AnimatingTimerPortal;
