// src/components/LeftDashboard.jsx

import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AiOutlineHome, AiOutlineSetting } from "react-icons/ai";
import { FiBarChart2, FiBox, FiUser } from "react-icons/fi";
import { LuUsers } from "react-icons/lu";
import {
  MdOutlineKeyboardArrowLeft,
  MdOutlineKeyboardArrowRight,
  MdOutlineMenu,
  MdDarkMode,
} from "react-icons/md";
import { FaSun } from "react-icons/fa";
import { ThemeContext } from "../ThemeContext/ThemeContext";
import { CompanySettingsContext } from "../../context/CompanySettingsContext";
import { useAuth } from "../../pages/hooks/useAuth";

const LeftDashboard = () => {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { companyLogoUrl, isLoadingSettings } = useContext(CompanySettingsContext);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, userRole, isLoading } = useAuth();

  // ✅ Close mobile menu when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setIsMinimized((prev) => !prev);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const handleNavigation = (path) => {
    navigate(path);
    if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
  };

  if (isLoading) {
    return (
      <aside className="fixed inset-0 z-50 bg-white dark:bg-gray-800 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading navigation...</div>
      </aside>
    );
  }

  if (!isAuthenticated) return null;

  // ✅ Navigation items
  const navItems = [
    { icon: <AiOutlineHome className="text-xl" />, name: "Dashboard", path: "/dashboard" },
    ...(userRole === "Administrator" || userRole === "Tecnical_Head"
      ? [{ icon: <FiBarChart2 className="text-xl" />, name: "Summary", path: "/dashboard/summary" }]
      : []),
    ...(userRole === "Administrator" || userRole === "Tecnical_Head"
      ? [{ icon: <FiBox className="text-xl" />, name: "Add Item", path: "/dashboard/additem" }]
      : []),
    ...(userRole === "Administrator" || userRole === "Tecnical_Head"
      ? [{ icon: <LuUsers className="text-xl" />, name: "Add User", path: "/dashboard/adduser" }]
      : []),
    ...(userRole === "Administrator" || userRole === "Tecnical_Head"
      ? [{ icon: <FiUser className="text-xl" />, name: "Add Customer", path: "/dashboard/addcustomer" }]
      : []),
    { icon: <AiOutlineSetting className="text-xl" />, name: "Settings", path: "/dashboard/settings" },
  ];

  return (
    <>
      {/* ✅ Mobile Menu Button — stays at top-left, never overlaps logo */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <button
          onClick={toggleMobileMenu}
          className={`p-2 rounded-full shadow-md transition-colors duration-300 ${
            isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
          }`}
          aria-label="Open sidebar"
        >
          <MdOutlineMenu className="text-2xl" />
        </button>
      </div>

      {/* ✅ Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-30 flex flex-col shadow-lg transition-all duration-300 ease-in-out border-r
          ${isDarkMode ? "bg-gray-900 text-white border-gray-600" : "bg-white text-black border-gray-300"}
          ${isMinimized ? "w-20 p-4" : "w-60 p-6"}
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:relative lg:flex ${isMinimized ? "lg:w-20" : "lg:w-60"}`}
      >
        {/* ✅ Logo Section */}
        <div className="relative flex items-center justify-center mb-6">
          {companyLogoUrl && !isLoadingSettings ? (
            <img
              src={companyLogoUrl}
              alt="Company Logo"
              className={`transition-all duration-300 rounded-full object-cover border border-gray-400 ${
                isMinimized ? "w-10 h-10" : "w-16 h-16"
              }`}
            />
          ) : (
            <FiUser
              className={`transition-all duration-300 ${
                isMinimized ? "w-10 h-10" : "w-16 h-16"
              } text-gray-400 rounded-full`}
            />
          )}

          {/* ✅ Collapse Toggle Button — sits at the sidebar edge, outside the logo space */}
          {/* <div
            className={`hidden lg:flex absolute top-1/2 -translate-y-1/2 right-[-14px]
              p-2 rounded-full cursor-pointer transition-all duration-300
              ${isDarkMode ? "hover:bg-gray-700 active:bg-gray-600" : "hover:bg-gray-200 active:bg-gray-300"}`}
            onClick={toggleSidebar}
          >
            {isMinimized ? (
              <MdOutlineKeyboardArrowRight className={`${isDarkMode ? "text-white" : "text-black"} text-lg`} />
            ) : (
              <MdOutlineKeyboardArrowLeft className={`${isDarkMode ? "text-white" : "text-black"} text-lg`} />
            )}
          </div> */}
        </div>

        <hr className={`my-4 ${isDarkMode ? "border-gray-600" : "border-gray-300"}`} />

        {/* ✅ Nav Items */}
        <nav className="flex-1">
          <ul className="space-y-1">
            {navItems.map((item, index) => (
              <li
                key={index}
                className={`flex items-center ${isMinimized ? "justify-center" : "gap-4"}
                  py-3 px-4 rounded-lg cursor-pointer transition-all duration-200
                  ${location.pathname === item.path ? "bg-blue-500 text-white" : ""}
                  ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-300"}`}
                onClick={() => handleNavigation(item.path)}
              >
                {item.icon}
                {!isMinimized && <span className="text-base font-medium">{item.name}</span>}
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* ✅ Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className={`fixed inset-0 z-20 lg:hidden ${
            isDarkMode ? "bg-black-800 bg-opacity-50" : "bg-white-800 bg-opacity-50"
          }`}
          onClick={toggleMobileMenu}
        />
      )}
    </>
  );
};

export default LeftDashboard;
