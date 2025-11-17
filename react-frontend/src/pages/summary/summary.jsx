import React, { useContext, useState, useRef, useEffect } from "react";
import { ThemeContext } from "../../components/ThemeContext/ThemeContext";
import IncomePieChart from "../../components/SummaryDashboard/IncomePieChart";
import JobStatusPieChart from "../../components/SummaryDashboard/JobStatusPieChart";
import IncomeBarChart from "../../components/SummaryDashboard/IncomeBarChart";
import JobTitlePieChart from "../../components/SummaryDashboard/JobTitlePieChart";
import TechnicianBarChart from "../../components/SummaryDashboard/TechnicianBarChart";
import KeyMetrics from "../../components/SummaryDashboard/KeyMetrics";
import PaymentLineChart from "../../components/SummaryDashboard/PaymentLineChart";
import YearlyPaymentChart from "../../components/SummaryDashboard/YearlyPaymentChart";
import Calendar from "../../components/Calender/Calender";
import { motion } from 'framer-motion';
import { FaCalendarAlt } from 'react-icons/fa';
import LoadingItems from "../../components/Loading/LoadingItems";

const Summary = () => {
  const { isDarkMode } = useContext(ThemeContext);

  // Loading state for page initialization
  const [loading, setLoading] = useState(true);

  // State for selected dates
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // State for showing calendars
  const [showDailyCalendar, setShowDailyCalendar] = useState(false);
  const [showMonthlyCalendar, setShowMonthlyCalendar] = useState(false);
  const [showYearlyCalendar, setShowYearlyCalendar] = useState(false);

  // State to toggle heading view
  const [showAddItemHeading, setShowAddItemHeading] = useState(false);

  // Refs for calendar containers
  const dailyRef = useRef(null);
  const monthlyRef = useRef(null);
  const yearlyRef = useRef(null);

  // Handlers for calendar selections
  const handleDaySelect = (date) => {
    setSelectedDay(date);
    setShowDailyCalendar(false);
  };

  const handleMonthSelect = (date) => {
    setSelectedMonth(date);
    setShowMonthlyCalendar(false);
  };

  const handleYearSelect = (date) => {
    setSelectedYear(date.getFullYear());
    setShowYearlyCalendar(false);
  };

  // Effect to handle page loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500); // Show loading for 1.5 seconds

    return () => clearTimeout(timer);
  }, []);

  // Show loading component while page is initializing
  if (loading) {
    return <LoadingItems isDarkMode={isDarkMode} message="Loading Summary Dashboard..." size="large" />;
  }

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="flex justify-center mb-6">
        
      </div>

       
        <div className={`${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'} rounded-xl p-6 shadow-lg flex justify-between items-center mb-8`}>
          <div>
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Summary Dashboard</h1>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Monitor progress, track performance, and make informed decisions faster.</p>
          </div>
        </div>

      <KeyMetrics />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <IncomePieChart />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <JobStatusPieChart />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <JobTitlePieChart />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <TechnicianBarChart />
        </motion.div>
      </div>

      {/* Calendars and charts for payment trends */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setShowDailyCalendar(!showDailyCalendar)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm transition-colors duration-200 ${
              isDarkMode
                ? "bg-gray-800 text-white hover:bg-gray-700"
                : "bg-gray-100 text-gray-900 hover:bg-gray-200"
            }`}
          >
            <FaCalendarAlt
              className={`text-xl ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
            />
            <h3 className="text-base font-medium">Select Day</h3>
          </button>
        </div>

        {showDailyCalendar && (
          <div
            ref={dailyRef}
            className={`absolute z-10 mt-2 left-0 rounded-xl shadow-lg border ${
              isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
            }`}
          >
            <Calendar selectedDate={selectedDay} onDateSelect={handleDaySelect} />
          </div>
        )}

        <PaymentLineChart selectedDate={selectedDay} />
      </div>

        <div className="relative">
          <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setShowMonthlyCalendar(!showMonthlyCalendar)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm transition-colors duration-200 ${
              isDarkMode
                ? "bg-gray-800 text-white hover:bg-gray-700"
                : "bg-gray-100 text-gray-900 hover:bg-gray-200"
            }`}
          >
            <FaCalendarAlt
              className={`text-xl ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
            />
            <h3 className="text-base font-medium">Select Month</h3>
          </button>
        </div>

        {showMonthlyCalendar && (
        <div
          ref={monthlyRef}
          className={`absolute z-10 mt-2 left-0 rounded-xl shadow-lg border ${
            isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          <Calendar
            selectedDate={selectedMonth}
            onDateSelect={handleMonthSelect}
            isDarkMode={isDarkMode} // keep theme consistent
          />
        </div>
      )}

          <IncomeBarChart year={selectedMonth.getFullYear()} month={selectedMonth.getMonth() + 1} />
        </div>
        <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setShowYearlyCalendar(!showYearlyCalendar)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm transition-colors duration-200 ${
              isDarkMode
                ? "bg-gray-800 text-white hover:bg-gray-700"
                : "bg-gray-100 text-gray-900 hover:bg-gray-200"
            }`}
          >
            <FaCalendarAlt
              className={`text-xl ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
            />
            <h3 className="text-base font-medium">Select Year</h3>
          </button>
        </div>

        {showYearlyCalendar && (
          <div
            ref={yearlyRef}
            className={`absolute z-10 mt-2 left-0 rounded-xl shadow-lg border ${
              isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
            }`}
          >
            <Calendar
              selectedDate={new Date(selectedYear, 0, 1)}
              onDateSelect={handleYearSelect}
              isDarkMode={isDarkMode}
            />
          </div>
        )}

        <YearlyPaymentChart selectedYear={selectedYear} />
      </div>

      </div>
    </div>
  );
};

export default Summary;
