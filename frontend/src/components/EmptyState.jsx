import { useTranslation } from 'react-i18next';

export default function EmptyState({ title, message, actionLabel, onAction }) {
        const { t } = useTranslation('errors');

        const resolvedTitle = title || t('emptyState.defaultTitle', 'Nothing here yet');
        const resolvedMessage = message || t('emptyState.defaultMessage', 'Get started by creating your first item.');
        const resolvedAction = actionLabel || t('emptyState.defaultAction', 'Create item');

        return (
                <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center">
                        <div className="mb-5 sm:mb-6 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#FFF8F0] flex items-center justify-center">
                                <svg
                                        className="w-10 h-10 sm:w-12 sm:h-12 text-[#A8C9B8]"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                >
                                        <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                        />
                                </svg>
                        </div>

                        <h3
                                className="text-xl sm:text-2xl font-bold text-[#035035] mb-3 break-words px-4"
                                style={{ fontFamily: 'Georgia, serif' }}
                        >
                                {resolvedTitle}
                        </h3>

                        <p className="text-base sm:text-lg text-[#2D2D2D] opacity-70 mb-6 sm:mb-8 max-w-md break-words px-4">
                                {resolvedMessage}
                        </p>

                        {onAction && (
                                <button
                                        onClick={onAction}
                                        className="bg-[#035035] text-white px-6 sm:px-8 py-3 rounded-full font-semibold hover:scale-105 transition-all shadow-md hover:shadow-lg min-h-[44px] text-sm sm:text-base"
                                        style={{
                                                transitionDuration: '300ms',
                                                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                                        }}
                                >
                                        {resolvedAction}
                                </button>
                        )}
                </div>
        );
}
