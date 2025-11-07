import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PiArrowLeftBold, PiArrowRightBold, PiLightningBold } from 'react-icons/pi';

const OVERLAY_PADDING = 16;

const InstructionOnboardingTour = ({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onBack,
  onSkip,
}) => {
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (!step?.target) {
      setRect(null);
      return undefined;
    }

    const updateRect = () => {
      const bounds = step.target.getBoundingClientRect();
      setRect({
        top: bounds.top - OVERLAY_PADDING,
        left: bounds.left - OVERLAY_PADDING,
        width: bounds.width + OVERLAY_PADDING * 2,
        height: bounds.height + OVERLAY_PADDING * 2,
      });
    };

    updateRect();

    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [step]);

  if (!step || !rect) {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[90]">
      {/* Top overlay */}
      <div
        className="absolute left-0 right-0 bg-[#2D2D2D]/65 backdrop-blur-sm"
        style={{
          top: 0,
          height: `${Math.max(rect.top, 16)}px`,
        }}
      />

      {/* Left overlay */}
      <div
        className="absolute bg-[#2D2D2D]/65 backdrop-blur-sm"
        style={{
          top: `${Math.max(rect.top, 16)}px`,
          left: 0,
          width: `${Math.max(rect.left, 16)}px`,
          height: `${rect.height}px`,
        }}
      />

      {/* Right overlay */}
      <div
        className="absolute bg-[#2D2D2D]/65 backdrop-blur-sm"
        style={{
          top: `${Math.max(rect.top, 16)}px`,
          left: `${Math.max(rect.left, 16) + rect.width}px`,
          right: 0,
          height: `${rect.height}px`,
        }}
      />

      {/* Bottom overlay */}
      <div
        className="absolute left-0 right-0 bg-[#2D2D2D]/65 backdrop-blur-sm"
        style={{
          top: `${Math.max(rect.top, 16) + rect.height}px`,
          bottom: 0,
        }}
      />

      {/* Highlight border around focused element */}
      <div
        className="pointer-events-none absolute rounded-3xl border-4 border-[#FF9B7B] transition-all duration-300 shadow-lg shadow-[#FF9B7B]/50"
        style={{
          top: `${Math.max(rect.top, 16)}px`,
          left: `${Math.max(rect.left, 16)}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
        }}
      />

      <div className="pointer-events-auto absolute inset-x-0 bottom-10 flex justify-center px-4">
        <div className="w-full max-w-2xl rounded-3xl border-2 border-white/40 bg-white/95 p-6 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3 text-[#035035]">
            <PiLightningBold className="text-2xl" />
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#A8C9B8]">
              Schritt {stepIndex + 1} von {totalSteps}
            </p>
          </div>
          <h3 className="mt-3 font-['Poppins',_sans-serif] text-xl font-bold text-[#035035] sm:text-2xl">
            {step.title}
          </h3>
          <p className="mt-2 text-sm text-[#2D2D2D]/80 sm:text-base">
            {step.description}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                disabled={stepIndex === 0}
                className="flex items-center gap-2 rounded-full border-2 border-transparent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#035035]/70 transition hover:border-[#A8C9B8] hover:text-[#035035] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <PiArrowLeftBold className="text-base" />
                Zurück
              </button>
              <button
                type="button"
                onClick={onSkip}
                className="rounded-full border-2 border-[#FF9B7B] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#FF9B7B] transition hover:bg-[#FF9B7B] hover:text-white"
              >
                Tour überspringen
              </button>
            </div>
            <button
              type="button"
              onClick={onNext}
              className="flex items-center gap-2 rounded-full bg-[#035035] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:scale-105 hover:bg-[#024028] active:scale-95"
            >
              Weiter
              <PiArrowRightBold className="text-lg" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default InstructionOnboardingTour;
