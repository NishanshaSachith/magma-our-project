import React from 'react';
import { FaHourglassStart, FaTools, FaCheckCircle, FaUserCheck, FaAward, FaClipboardList } from 'react-icons/fa'; // Removed FaTimesCircle for canceled

/**
 * Renders a professional-looking progress bar for job statuses.
 * @param {object} props - The component props.
 * @param {boolean} props.special_approve - Special approve flag from job_homes.
 * @param {boolean} props.customer_ok - Customer ok flag from job_homes.
 * @param {boolean} props.service_start - Service start flag from job_homes.
 * @param {boolean} props.service_end - Service end flag from job_homes.
 * @param {number} props.payment - Payment amount.
 * @param {string} props.job_status - Job status string (e.g., "pending", "cancel").
 * @param {boolean} props.isDarkMode - Indicates if dark mode is active, affecting text and background colors.
 */
const ProgressBar = ({ special_approve, customer_ok, service_start, service_end, payment, job_status, isDarkMode }) => {
  // Determine current status based on job_status from job_homes table
  let currentStatus = "Pending";
  if (job_status) {
    switch (job_status.toLowerCase()) {
      case 'todo':
        currentStatus = "Todo";
        break;
      case 'inprocess':
        currentStatus = "In Process";
        break;
      case 'end':
        currentStatus = "Ended";
        break;
      case 'complete':
        currentStatus = "Completed";
        break;
      case 'pending':
        currentStatus = "Pending";
        break;
      default:
        // Fallback to flags if job_status doesn't match
        if (customer_ok && special_approve) {
          currentStatus = "Completed";
        } else if (service_end) {
          currentStatus = "Ended";
        } else if (service_start || (payment && payment > 0)) {
          currentStatus = "In Process";
        } else if (special_approve) {
          currentStatus = "Todo";
        }
        break;
    }
  } else {
    // Fallback if no job_status
    if (customer_ok && special_approve) {
      currentStatus = "Completed";
    } else if (service_end) {
      currentStatus = "Ended";
    } else if (service_start || (payment && payment > 0)) {
      currentStatus = "In Process";
    } else if (special_approve) {
      currentStatus = "Todo";
    }
  }

  const statuses = [
    { name: "Pending", icon: FaHourglassStart, progress: 0, color: isDarkMode ? 'bg-gray-600' : 'bg-blue-500' },
    { name: "Todo", icon: FaClipboardList, progress: 25, color: 'bg-blue-500' },
    { name: "In Process", icon: FaTools, progress: 50, color: 'bg-blue-500' },
    { name: "Ended", icon: FaCheckCircle, progress: 70, color: 'bg-blue-500' },
    { name: "Completed", icon: FaAward, progress: 100, color: 'bg-green-600' },
  ];

  const currentStatusIndex = statuses.findIndex(s => s.name === currentStatus);
  let currentProgressPercentage = statuses[currentStatusIndex]?.progress || 0;
  let progressBarColor = statuses[currentStatusIndex]?.color.includes('green') ? '#16a34a' : '#3b82f6';

  if (job_status && job_status.toLowerCase() === 'cancel') {
    currentProgressPercentage = 100;
    progressBarColor = '#dc2626'; // red color for cancel
  }

  return (
    <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-2xl mx-auto px-2 sm:px-4">
      <div className="relative flex justify-between items-center w-full mb-3 sm:mb-4">
        {/* The main progress line (track) */}
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1.5 sm:h-2 rounded-full w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
          {/* The filled part of the progress line */}
          <div
            className={`h-full rounded-full`}
            style={{ width: `${currentProgressPercentage}%`, backgroundColor: progressBarColor, transition: 'none' }}
          ></div>
        </div>

        {/* Individual Status Circles and Labels */}
        {statuses.map((status, index) => {
          const isActive = index <= currentStatusIndex;
          const isCurrent = index === currentStatusIndex;

          // Check if status.icon exists before trying to render it
          const IconComponent = status.icon;

          return (
            <div key={status.name} className="flex flex-col items-center z-10">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white
                  ${isActive ? status.color + ' scale-105 sm:scale-110 shadow-md sm:shadow-lg' : (isDarkMode ? 'bg-gray-600' : 'bg-gray-400')}
                  ${isCurrent ? 'border-2 sm:border-4 border-blue-300' : ''}`}
                title={status.name}
              >
                {IconComponent && <IconComponent className="text-sm sm:text-base md:text-xl" />} {/* Render the icon only if it exists */}
              </div>
              <p className={`mt-1.5 sm:mt-2 text-center text-[0.6rem] xs:text-xs sm:text-sm font-medium whitespace-nowrap
                ${isActive ? (isDarkMode ? 'text-blue-300' : 'text-blue-700') : (isDarkMode ? 'text-gray-400' : 'text-gray-600')}`}>
                {status.name}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;
