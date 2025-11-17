import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function LogoutPage() {
  const navigate = useNavigate();
  const delay = 1200; // Slightly shorter, professional feel

  useEffect(() => {
    localStorage.removeItem('authToken');

    const timer = setTimeout(() => {
      navigate('/login');
    }, delay);

    return () => clearTimeout(timer);
  }, [navigate, delay]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:via-blue-900 dark:to-gray-900 transition-all duration-300 p-4">
      <div className="bg-white dark:bg-gray-800 shadow-lg sm:shadow-xl rounded-lg sm:rounded-xl p-6 sm:p-8 md:p-10 max-w-xs sm:max-w-sm md:max-w-md w-full">
        <div className="mb-4 sm:mb-6">
          <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1m6 4h.01M9 16h.01" />
          </svg>
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 text-center">Logging Out</h1>
        <p className="text-sm sm:text-base md:text-md text-gray-600 dark:text-gray-400 mb-4 sm:mb-5 text-center">
          Please wait while we securely log you out.
        </p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500 dark:border-blue-400"></div>
        </div>
        <p className="mt-3 sm:mt-4 text-xs sm:text-sm md:text-base text-gray-500 dark:text-gray-500 text-center">
          Redirecting in <span className="font-semibold">{delay / 1000}</span> seconds...
        </p>
      </div>
    </div>
  );
}

export default LogoutPage;
