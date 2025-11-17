import React, { useEffect, useState } from 'react';

const Notification = ({ message = '', type = 'success', onClose, duration = 5000 }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        console.log('Notification component received:', { message, type });
        // Only run if there is a message
        if (message) {
            // Reset visibility to true when a new message arrives
            setIsVisible(true);

            // Set a timer to hide the notification
            const timer = setTimeout(() => {
                setIsVisible(false);
                onClose?.();
            }, duration);

            // Cleanup function to clear the timer
            return () => clearTimeout(timer);
        } else {
            // If the message is empty, ensure the notification is not visible
            setIsVisible(false);
        }
    }, [message, onClose, duration]);

    // Do not render if not visible or no message
    if (!isVisible || !message) return null;

    const typeClasses = {
        success: "bg-gradient-to-r from-emerald-500 to-green-600 border-emerald-400/20",
        error: "bg-gradient-to-r from-red-500 to-rose-600 border-red-400/20"
    };

    const boxShadows = {
        success: "0 25px 50px -12px rgba(34, 197, 94, 0.4), 0 0 0 1px rgba(34, 197, 94, 0.1)",
        error: "0 25px 50px -12px rgba(239, 68, 68, 0.4), 0 0 0 1px rgba(239, 68, 68, 0.1)"
    };

    const Icon = type === "success" ? (
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    ) : (
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    );

    return (
        <div
            role="alert"
            aria-live="assertive"
            className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-sm border text-white transition-transform duration-300 ease-out animate-slide-in ${typeClasses[type]}`}
            style={{ boxShadow: boxShadows[type] }}
        >
            <div className="flex items-center space-x-3">
                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-white/20">
                    {Icon}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium leading-tight">{message}</p>
                </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3 w-full bg-white/20 rounded-full h-1 overflow-hidden">
                <div
                    className="h-full bg-white/60 rounded-full"
                    style={{
                        animation: `progressBar ${duration}ms linear forwards`
                    }}
                />
            </div>

            {/* Inline styles for animations */}
            <style>{`
                @keyframes progressBar {
                    from { width: 100%; }
                    to { width: 0%; }
                }

                @keyframes slide-in {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }

                .animate-slide-in {
                    animation: slide-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default Notification;