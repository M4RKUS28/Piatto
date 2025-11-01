import { useTranslation } from 'react-i18next';

export default function ErrorMessage({ message, onRetry }) {
        const { t } = useTranslation('errors');

        const resolvedMessage = message || t('generic.message', 'An unexpected error occurred. Please try again.');

        return (
                <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center">
                        <div className="mb-4 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#FF9B7B] bg-opacity-10 flex items-center justify-center">
                                <svg
                                        className="w-7 h-7 sm:w-8 sm:h-8 text-[#FF9B7B]"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                >
                                        <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                        />
                                </svg>
                        </div>

                        <p className="text-[#2D2D2D] text-base sm:text-lg font-medium mb-2 break-words px-4">
                                {t('generic.title', 'Oops! Something went wrong')}
                        </p>

                        <p className="text-sm sm:text-base text-[#2D2D2D] opacity-70 mb-6 max-w-md break-words px-4">
                                {resolvedMessage}
                        </p>

                        {onRetry && (
                                <button
                                        onClick={onRetry}
                                        className="bg-[#FF9B7B] text-white px-6 py-3 rounded-full font-semibold hover:scale-105 transition-all shadow-md hover:shadow-lg min-h-[44px] text-sm sm:text-base"
                                        style={{
                                                transitionDuration: '300ms',
                                                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                                        }}
                                >
                                        {t('generic.tryAgain', 'Try Again')}
                                </button>
                        )}
                </div>
        );
}
