import React from 'react';
import { PiMicrophoneBold, PiSpeakerHighBold } from 'react-icons/pi';

const SessionStartDialog = ({
  isOpen,
  mode = 'new',
  isSubmitting = false,
  onClose,
  onSelect,
}) => {
  if (!isOpen) {
    return null;
  }

  const titles = {
    new: 'Kochsession starten',
    resume: 'Kochsession fortsetzen',
  };

  const subtitles = {
    new: 'Wie möchtest du deine Session begleiten lassen?',
    resume: 'Willst du den Voice Assistant weiterhin nutzen?',
  };

  const handleSelect = (withVoice) => {
    if (isSubmitting) {
      return;
    }
    onSelect?.(withVoice);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#2D2D2D]/60 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-xl rounded-3xl border-2 border-[#A8C9B8] bg-white p-6 sm:p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-[#F5F5F5] p-2 text-[#2D2D2D] transition hover:scale-105 hover:bg-[#FF9B7B] hover:text-white"
          aria-label="Dialog schließen"
        >
          ×
        </button>
        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#A8C9B8]">Piatto Companion</p>
            <h2 className="mt-2 font-['Poppins',_sans-serif] text-2xl font-bold text-[#035035] sm:text-3xl">
              {titles[mode] || titles.new}
            </h2>
            <p className="mt-3 text-sm text-[#2D2D2D]/80 sm:text-base">
              {subtitles[mode] || subtitles.new}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleSelect(true)}
              className="group flex h-full flex-col items-start gap-3 rounded-2xl border-2 border-[#A8C9B8] bg-[#FFF8F0] p-5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9B7B] hover:-translate-y-1 hover:border-[#FF9B7B] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSubmitting}
            >
              <span className="flex items-center gap-3 text-[#035035]">
                <PiMicrophoneBold className="text-2xl" />
                <span className="text-lg font-semibold">Mit Voice Assistant</span>
              </span>
              <p className="text-sm text-[#2D2D2D]/80">
                Sprachsteuerung aktivieren, damit du freihändig weiterkochen kannst.
              </p>
              <span className="mt-auto rounded-full bg-[#035035] px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                Empfohlen für Hands-Free
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSelect(false)}
              className="group flex h-full flex-col items-start gap-3 rounded-2xl border-2 border-[#F5F5F5] bg-white p-5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A8C9B8] hover:-translate-y-1 hover:border-[#035035]/60 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSubmitting}
            >
              <span className="flex items-center gap-3 text-[#2D2D2D]">
                <PiSpeakerHighBold className="text-2xl" />
                <span className="text-lg font-semibold">Ohne Voice Assistant</span>
              </span>
              <p className="text-sm text-[#2D2D2D]/80">
                Du steuerst die Schritte manuell – perfekt, wenn es leiser sein soll.
              </p>
              <span className="mt-auto rounded-full bg-[#FF9B7B]/20 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[#FF9B7B]">
                Jederzeit änderbar
              </span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-[#2D2D2D]/60">
              Du kannst den Voice Assistant später jederzeit wieder aktivieren oder deaktivieren.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border-2 border-transparent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#2D2D2D]/70 transition hover:border-[#FF9B7B] hover:text-[#FF9B7B]"
              disabled={isSubmitting}
            >
              Vielleicht später
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionStartDialog;
