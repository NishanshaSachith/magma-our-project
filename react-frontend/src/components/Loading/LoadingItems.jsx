import React from 'react';
import { FaSpinner, FaCog, FaTools } from 'react-icons/fa';

const LoadingItems = ({ isDarkMode, message = "Loading...", size = "large" }) => {
  // Different loading animations
  const LoadingSpinner = () => (
    <FaSpinner className={`animate-spin ${
      size === "small" ? "text-2xl" : 
      size === "medium" ? "text-3xl" : "text-4xl"
    } ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
  );

  const LoadingDots = () => (
    <div className="flex space-x-2">
      <div className={`w-3 h-3 rounded-full animate-bounce ${isDarkMode ? "bg-blue-400" : "bg-blue-600"}`}></div>
      <div className={`w-3 h-3 rounded-full animate-bounce delay-75 ${isDarkMode ? "bg-blue-400" : "bg-blue-600"}`}></div>
      <div className={`w-3 h-3 rounded-full animate-bounce delay-150 ${isDarkMode ? "bg-blue-400" : "bg-blue-600"}`}></div>
    </div>
  );

  const LoadingPulse = () => (
    <div className={`w-12 h-12 rounded-full animate-pulse ${isDarkMode ? "bg-blue-400" : "bg-blue-600"}`}></div>
  );

  // Container classes based on size
  const containerClasses = {
    small: "p-4",
    medium: "p-8",
    large: "min-h-screen p-8"
  };

  return (
    <div className={`
      ${containerClasses[size]} 
      flex items-center justify-center 
      ${isDarkMode ? "bg-gray-900" : "bg-white-100"}
    `}>
      <div className={`
        flex flex-col items-center space-y-6 p-8 rounded-xl shadow-lg
        ${isDarkMode 
          ? "bg-gray-800 border border-gray-700" 
          : "bg-white border border-gray-200"
        }
      `}>
        {/* Main Loading Animation */}
        <div className="flex justify-center">
          <LoadingSpinner />
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-2">
          <h3 className={`
            text-lg font-semibold
            ${isDarkMode ? "text-gray-200" : "text-gray-700"}
          `}>
            {message}
          </h3>
          
          {/* Animated dots */}
          <div className="flex justify-center">
            <LoadingDots />
          </div>
        </div>

        {/* Progress indicator (optional) */}
        <div className={`
          w-48 h-1 rounded-full overflow-hidden
          ${isDarkMode ? "bg-gray-700" : "bg-gray-300"}
        `}>
          <div className={`
            h-full rounded-full animate-pulse
            ${isDarkMode ? "bg-blue-400" : "bg-blue-600"}
          `} style={{
            width: '60%',
            animation: 'loading-progress 2s ease-in-out infinite'
          }}></div>
        </div>

        {/* Loading tips (optional) */}
        <p className={`
          text-sm text-center max-w-xs
          ${isDarkMode ? "text-gray-400" : "text-gray-500"}
        `}>
          Please wait while we prepare your job details...
        </p>
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes loading-progress {
          0% { width: 10%; }
          50% { width: 80%; }
          100% { width: 10%; }
        }
      `}</style>
          </div>
        );
      };

// Alternative minimal loading component
export const MinimalLoading = ({ isDarkMode }) => (
  <div className={`
    min-h-screen flex items-center justify-center
    ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}
  `}>
    <div className="flex flex-col items-center space-y-4">
      <FaSpinner className={`
        text-4xl animate-spin
        ${isDarkMode ? "text-blue-400" : "text-blue-600"}
      `} />
      <p className={`
        text-lg font-semibold
        ${isDarkMode ? "text-gray-200" : "text-gray-700"}
      `}>
        Loading...
      </p>
    </div>
  </div>
);

// Loading component with job-specific styling
export const JobLoading = ({ isDarkMode, jobType = "Job" }) => (
  <div className={`
    min-h-screen flex items-center justify-center
    ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}
  `}>
    <div className={`
      flex flex-col items-center space-y-6 p-8 rounded-xl shadow-lg max-w-md mx-4
      ${isDarkMode 
        ? "bg-gray-800 border border-gray-700" 
        : "bg-white border border-gray-200"
      }
    `}>
      {/* Job-specific icon */}
      <div className="relative">
        <FaTools className={`
          text-5xl animate-bounce
          ${isDarkMode ? "text-blue-400" : "text-blue-600"}
        `} />
        <FaCog className={`
          absolute -top-2 -right-2 text-lg animate-spin
          ${isDarkMode ? "text-gray-400" : "text-gray-600"}
        `} style={{ animationDuration: '3s' }} />
      </div>

      <div className="text-center space-y-3">
        <h3 className={`
          text-xl font-bold
          ${isDarkMode ? "text-gray-100" : "text-gray-800"}
        `}>
          Loading {jobType}
        </h3>
        
        <p className={`
          text-sm
          ${isDarkMode ? "text-gray-300" : "text-gray-600"}
        `}>
          Preparing your job management interface...
        </p>

        {/* Progress steps */}
        <div className="space-y-2 mt-4">
          {['Fetching job data', 'Loading components', 'Almost ready'].map((step, index) => (
            <div key={index} className={`
              flex items-center space-x-2 text-xs
              ${isDarkMode ? "text-gray-400" : "text-gray-500"}
            `}>
              <div className={`
                w-2 h-2 rounded-full animate-pulse
                ${isDarkMode ? "bg-blue-400" : "bg-blue-600"}
              `} style={{ animationDelay: `${index * 0.5}s` }}></div>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default LoadingItems;