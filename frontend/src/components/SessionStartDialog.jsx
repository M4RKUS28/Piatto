import React from 'react';
import { useTranslation } from 'react-i18next';
import { PiMicrophoneBold, PiSpeakerHighBold } from 'react-icons/pi';

const SessionStartDialog = ({
  isOpen,
  mode = 'new',
  isSubmitting = false,
  onClose,
  onSelect,
  wakeWordSupported = true,
}) => {
  const { t } = useTranslation('instructions');

  if (!isOpen) {
    return null;
  }

  const title = mode === 'resume'
    ? t('sessionDialog.titleResume', 'Resume cooking session')
    : t('sessionDialog.titleNew', 'Start cooking session');

  const subtitle = mode === 'resume'
    ? t('sessionDialog.subtitleResume', 'Do you want to keep using the voice assistant?')
    : t('sessionDialog.subtitleNew', 'How would you like to be guided?');

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
          aria-label={t('sessionDialog.closeLabel', 'Close dialog')}
        >
          ×
        </button>
        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#A8C9B8]">
              {t('sessionDialog.badge', 'Piatto Companion')}
            </p>
            <h2 className="mt-2 font-['Poppins',_sans-serif] text-2xl font-bold text-[#035035] sm:text-3xl">
              {title}
            </h2>
            <p className="mt-3 text-sm text-[#2D2D2D]/80 sm:text-base">
              {subtitle}
            </p>
          </div>

          {!wakeWordSupported ? (
            // Show only info message when wake word is not supported
            <>
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                <span className="text-xl font-bold" aria-hidden="true">
                  !
                </span>
                <div>
                  <p className="text-sm font-semibold">
                    {t('sessionDialog.wakeWordUnsupported.title', 'Wake word detection unavailable')}
                  </p>
                  <p className="text-xs sm:text-sm mt-1 text-amber-900/90">
                    {t('sessionDialog.wakeWordUnsupported.description', 'Your browser cannot listen for "Hey Piatto", but you can still tap the chat bubble to talk to the assistant.')}
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full bg-[#035035] px-6 py-2 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-[#046847] hover:shadow-lg"
                >
                  {t('sessionDialog.understood', 'OK, Understood')}
                </button>
              </div>
            </>
          ) : (
            // Show button selection when wake word is supported
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleSelect(true)}
                  className="group flex h-full flex-col items-start gap-3 rounded-2xl border-2 border-[#A8C9B8] bg-[#FFF8F0] p-5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9B7B] hover:-translate-y-1 hover:border-[#FF9B7B] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSubmitting}
                >
                  <span className="flex items-center gap-3 text-[#035035]">
                    <PiMicrophoneBold className="text-2xl" />
                    <span className="text-lg font-semibold">
                      {t('sessionDialog.withVoice.label', 'With voice assistant')}
                    </span>
                  </span>
                  <p className="text-sm text-[#2D2D2D]/80">
                    {t('sessionDialog.withVoice.description', 'Enable voice control so you can keep cooking hands-free.')}
                  </p>
                  <span className="mt-auto rounded-full bg-[#035035] px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                    {t('sessionDialog.withVoice.pill', 'Recommended for hands-free cooking')}
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
                    <span className="text-lg font-semibold">
                      {t('sessionDialog.withoutVoice.label', 'Without voice assistant')}
                    </span>
                  </span>
                  <p className="text-sm text-[#2D2D2D]/80">
                    {t('sessionDialog.withoutVoice.description', 'Control the steps manually—perfect when you prefer it quiet.')}
                  </p>
                  <span className="mt-auto rounded-full bg-[#FF9B7B]/20 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[#FF9B7B]">
                    {t('sessionDialog.withoutVoice.pill', 'You can change this anytime')}
                  </span>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-[#2D2D2D]/60">
                  {t('sessionDialog.info', 'You can toggle the voice assistant at any time.')}
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border-2 border-transparent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#2D2D2D]/70 transition hover:border-[#FF9B7B] hover:text-[#FF9B7B]"
                  disabled={isSubmitting}
                >
                  {t('sessionDialog.maybeLater', 'Maybe later')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionStartDialog;
