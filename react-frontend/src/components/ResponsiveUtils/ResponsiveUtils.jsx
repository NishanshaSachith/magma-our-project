import React from 'react';

// Utility functions for responsive design
export const useResponsive = () => {
  const [isMobile, setIsMobile] = React.useState(false);
  const [isTablet, setIsTablet] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile, isTablet, isDesktop };
};

// Responsive grid component
export const ResponsiveGrid = ({ children, className = '', ...props }) => {
  const baseClasses = "grid gap-4 sm:gap-6";
  return (
    <div className={`${baseClasses} ${className}`} {...props}>
      {children}
    </div>
  );
};

// Responsive card component
export const ResponsiveCard = ({ children, className = '', darkMode = false, ...props }) => {
  const baseClasses = `rounded-xl p-4 sm:p-6 shadow-lg transition-all duration-300 ${
    darkMode 
      ? 'bg-gray-900 border border-gray-800 text-white' 
      : 'bg-white border border-gray-200 text-black'
  }`;
  
  return (
    <div className={`${baseClasses} ${className}`} {...props}>
      {children}
    </div>
  );
};

// Responsive button component
export const ResponsiveButton = ({ 
  children, 
  className = '', 
  variant = 'primary', 
  size = 'md',
  ...props 
}) => {
  const baseClasses = "rounded-lg font-medium transition-all duration-300 flex items-center justify-center";
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white",
    secondary: "bg-gray-500 hover:bg-gray-600 text-white",
    danger: "bg-red-500 hover:bg-red-600 text-white",
    success: "bg-green-500 hover:bg-green-600 text-white",
    outline: "border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
  };
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

// Responsive input component
export const ResponsiveInput = ({ 
  label, 
  className = '', 
  darkMode = false, 
  ...props 
}) => {
  const inputBgColor = darkMode ? "bg-gray-800" : "bg-gray-200";
  const inputTextColor = darkMode ? "text-white" : "text-gray-800";
  const placeholderColor = darkMode ? "placeholder-gray-400" : "placeholder-gray-500";
  
  return (
    <div className="space-y-2">
      {label && (
        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {label}
        </label>
      )}
      <input
        className={`w-full ${inputBgColor} ${inputTextColor} ${placeholderColor} border-none rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${className}`}
        {...props}
      />
    </div>
  );
};

// Responsive container component
export const ResponsiveContainer = ({ children, className = '', ...props }) => {
  return (
    <div className={`container mx-auto px-4 sm:px-6 lg:px-8 ${className}`} {...props}>
      {children}
    </div>
  );
};

export default {
  useResponsive,
  ResponsiveGrid,
  ResponsiveCard,
  ResponsiveButton,
  ResponsiveInput,
  ResponsiveContainer
};
