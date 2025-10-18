export default function LoadingSpinner({ size = 'medium' }) {
        const sizeClasses = {
                small: 'w-6 h-6',
                medium: 'w-12 h-12',
                large: 'w-16 h-16'
        };

        return (
                <div className="flex items-center justify-center">
                        <div className={`${sizeClasses[size]} relative`}>
                                <div className="absolute inset-0 rounded-full border-4 border-[#A8C9B8] opacity-25"></div>
                                <div
                                        className="absolute inset-0 rounded-full border-4 border-[#035035] border-t-transparent animate-spin"
                                        style={{
                                                animationDuration: '0.8s',
                                                animationTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                                        }}
                                ></div>
                        </div>
                </div>
        );
}
