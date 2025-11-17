// src/components/TopDashboard.jsx
// Refactored for a more robust and flexible responsive design
import React, { useContext, useState, useRef, useEffect, useCallback } from "react";
import { ThemeContext } from "../ThemeContext/ThemeContext";
import { BsSearch } from "react-icons/bs";
import { FaSun } from 'react-icons/fa';
import { BiBell, BiUserCircle, BiCheck, BiTrash, BiCheckCircle, BiMessageCheck } from "react-icons/bi";
import { MdDarkMode, MdMenu } from "react-icons/md";
import { Link, useNavigate } from 'react-router-dom';
import { CompanySettingsContext } from '../../context/CompanySettingsContext';
import axios from 'axios';
import api from '../../services/api';
import LoadingItems from '../Loading/LoadingItems';
import ConfirmationModal from '../ConfirmationModal/ConfirmationModal';
import Notification from '../Notification/Notification';
import { useAuth } from "../../pages/hooks/useAuth";

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const TopDashboard = () => {
    const { isAuthenticated, userRole } = useAuth();
    const { isDarkMode, toggleTheme } = useContext(ThemeContext);
    const { companyName: contextCompanyName, isLoadingSettings } = useContext(CompanySettingsContext);
    const navigate = useNavigate();
    
    const [notificationCount, setNotificationCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isMessageOpen, setIsMessageOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [messageCount, setMessageCount] = useState(0);
    const profileRef = useRef(null);
    const notificationRef = useRef(null);
    const messageRef = useRef(null);

    const [userFullName, setUserFullName] = useState('Loading...');
    const [userProfileImageUrl, setUserProfileImageUrl] = useState(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [userDataError, setUserDataError] = useState(null);

    // Confirmation modal state (following ImageUpload pattern)
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedNotificationId, setSelectedNotificationId] = useState(null);
    const [selectedMessageId, setSelectedMessageId] = useState(null);
    const [deleteType, setDeleteType] = useState(null); // 'notification' or 'message'
    const [deleting, setDeleting] = useState(false);
    
    // Notification state (following ImageUpload pattern)
    const [notification, setNotificationState] = useState({ message: '', type: 'success' });

    // Notification helper functions (following ImageUpload pattern)
    const showNotification = useCallback((message, type) => {
        setNotificationState({ message, type });
    }, []);

    const clearNotification = useCallback(() => {
        setNotificationState({ message: '', type: 'success' });
    }, []);

    const formatDateTime = (value) => {
        if (!value) return 'N/A';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return 'N/A';
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${y}-${m}-${day} ${hh}:${mm}`;
    };

    const isValidProfileImage = (url) => !!url;

    const toggleProfile = () => {
        setIsProfileOpen(!isProfileOpen);
    };

    const toggleNotification = () => {
        setIsNotificationOpen(!isNotificationOpen);
    };

    const toggleMessage = () => {
        setIsMessageOpen(!isMessageOpen);
    };

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data.notifications || []);
            setNotificationCount(response.data.count || 0);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            showNotification('Failed to fetch notifications. Please try again.', 'error');
        }
    };

    const markNotificationAsRead = async (notificationId) => {
        try {
            await api.patch(`/notifications/${notificationId}/read`);
            setNotifications(prevNotifications => {
                return prevNotifications.map(n => {
                    if (n.id === notificationId) {
                        return { ...n, is_read: true };
                    }
                    return n;
                });
            });
            setNotificationCount(prevCount => Math.max(prevCount - 1, 0));
            showNotification('Notification marked as read!', 'success');
        } catch (error) {
            console.error('Error marking notification as read:', error);
            showNotification('Failed to mark notification as read. Please try again.', 'error');
        }
    };

    // Updated delete notification function with confirmation modal
    const handleDeleteNotification = (e, notificationId) => {
        e.stopPropagation();
        setSelectedNotificationId(notificationId);
        setDeleteType('notification');
        setShowDeleteModal(true);
    };

    const confirmDeleteNotification = async () => {
        if (!selectedNotificationId) return;
        
        setDeleting(true);
        try {
            const notificationToDelete = notifications.find(n => n.id === selectedNotificationId);
            await api.delete(`/notifications/${selectedNotificationId}`);
            setNotifications(prevNotifications => prevNotifications.filter(n => n.id !== selectedNotificationId));
            
            if (notificationToDelete && !notificationToDelete.is_read) {
                setNotificationCount(prevCount => Math.max(prevCount - 1, 0));
            }
            
            showNotification('Notification deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting notification:', error);
            showNotification('Failed to delete notification. Please try again.', 'error');
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
            setSelectedNotificationId(null);
            setDeleteType(null);
        }
    };

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchMessages = async (startDateParam, endDateParam) => {
        try {
            let url = '/messages/notifications';
            if (startDateParam && endDateParam) {
                url += `?startDate=${startDateParam}&endDate=${endDateParam}`;
            }
            const response = await api.get(url);
            setMessages(response.data.messages || []);
            setMessageCount(response.data.count || 0);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
            showNotification('Failed to fetch messages. Please try again.', 'error');
        }
    };

    // Handler for date change
    const handleStartDateChange = (e) => {
        setStartDate(e.target.value);
    };

    const handleEndDateChange = (e) => {
        setEndDate(e.target.value);
    };

    // Handler to apply date filter
    const applyDateFilter = () => {
        if (startDate && endDate) {
            fetchMessages(startDate, endDate);
        }
    };

    // Updated delete message function with confirmation modal
    const handleDeleteMessage = (e, messageId) => {
        e.stopPropagation();
        setSelectedMessageId(messageId);
        setDeleteType('message');
        setShowDeleteModal(true);
    };

    const confirmDeleteMessage = async () => {
        if (!selectedMessageId) return;
        
        setDeleting(true);
        try {
            await api.delete(`/messages/${selectedMessageId}`);
            setMessages(prev => prev.filter((m) => m.id !== selectedMessageId));
            setMessageCount(prev => Math.max(prev - 1, 0));
            showNotification('Message deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting message:', error);
            showNotification('Failed to delete message. Please try again.', 'error');
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
            setSelectedMessageId(null);
            setDeleteType(null);
        }
    };

    const handleConfirmDelete = () => {
        if (deleteType === 'notification') {
            confirmDeleteNotification();
        } else if (deleteType === 'message') {
            confirmDeleteMessage();
        }
    };

    const handleClickOutside = (event) => {
        if (profileRef.current && !profileRef.current.contains(event.target)) {
            setIsProfileOpen(false);
        }
        if (notificationRef.current && !notificationRef.current.contains(event.target)) {
            setIsNotificationOpen(false);
        }
        if (messageRef.current && !messageRef.current.contains(event.target)) {
            setIsMessageOpen(false);
        }
    };

    const fetchUserData = async () => {
        setIsLoadingUser(true);
        setUserDataError(null);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                navigate('/login');
                return;
            }
            const headers = { Authorization: `Bearer ${token}` };
            const response = await axios.get(`${API_BASE_URL}/profile`, { headers });
            const userData = response.data;
            const fullName = userData.username || 'User';
            const profileImageUrl = userData.profile_image_url || null;
            setUserFullName(fullName);
            setUserProfileImageUrl(profileImageUrl);
            const existingUserData = localStorage.getItem('user');
            let existingUser = {};
            if (existingUserData) {
                try {
                    existingUser = JSON.parse(existingUserData);
                } catch (e) {
                    console.warn('Failed to parse existing user data');
                }
            }
            const userDataForStorage = {
                ...existingUser,
                id: userData.id,
                name: fullName,
                username: userData.username,
                email: userData.email,
                profile_image_url: profileImageUrl,
            };
            localStorage.setItem('user', JSON.stringify(userDataForStorage));
        } catch (error) {
            console.error('Error fetching user data:', error);
            setUserDataError('Failed to load user data');
            if (error.response && error.response.status === 401) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                navigate('/login');
                return;
            }
            const storedUserData = localStorage.getItem('user');
            if (storedUserData) {
                try {
                    const user = JSON.parse(storedUserData);
                    setUserFullName(user.name || user.username || 'User');
                    setUserProfileImageUrl(user.profile_image_url || null);
                } catch (parseError) {
                    console.error('Error parsing cached user data:', parseError);
                    setUserFullName('Guest');
                    setUserProfileImageUrl(null);
                }
            } else {
                setUserFullName('Guest');
                setUserProfileImageUrl(null);
            }
            showNotification('Failed to load user data', 'error');
        } finally {
            setIsLoadingUser(false);
        }
    };

    useEffect(() => {
        fetchUserData();
        fetchNotifications();
        fetchMessages();
    }, [navigate]);


    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const handleProfileUpdate = () => {
            fetchUserData();
        };
        window.addEventListener('userProfileUpdated', handleProfileUpdate);
        return () => {
            window.removeEventListener('userProfileUpdated', handleProfileUpdate);
        };
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchUserData();
            fetchNotifications();
            fetchMessages();
        }, 5 * 60 * 1000); // 5 minutes
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            {/* Notification component at the top (following ImageUpload pattern) */}
            <Notification 
                message={notification.message} 
                type={notification.type} 
                onClose={clearNotification} 
            />
            
            {/* Confirmation Modal (following ImageUpload pattern) */}
            <ConfirmationModal
                show={showDeleteModal}
                isDarkMode={isDarkMode}
                title="Confirm Deletion"
                message={`Are you sure you want to permanently delete this ${deleteType}? This action cannot be undone.`}
                onConfirm={handleConfirmDelete}
                onCancel={() => {
                    setShowDeleteModal(false);
                    setSelectedNotificationId(null);
                    setSelectedMessageId(null);
                    setDeleteType(null);
                }}
                confirmLabel={deleting ? "Deleting..." : "Delete"}
                cancelLabel="Cancel"
            />

            <header
                className={`flex flex-col sm:flex-row items-center justify-between
                    p-3 sm:p-4 lg:p-6 xl:p-8
                    min-h-[48px] lg:min-h-[72px]
                    shadow-md transition-all duration-300 ${
                        isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"
                    }`}
            >
                {/* Company Name / Logo */}
                <div className="flex-shrink-0 text-center sm:text-left w-full sm:w-auto">
                    <Link to="#" className="text-xl md:text-2xl font-semibold">
                        {isLoadingSettings ? "Loading..." : (contextCompanyName || "Magma Engineering Solutions (Pvt) Ltd")}
                    </Link>
                </div>

                {/* Right-aligned container for search, icons, and profile */}
                <div className="flex-grow flex flex-wrap items-center justify-end mt-3 sm:mt-0 gap-4 sm:gap-6">
                    {/* Icon group for theme, notifications, and profile */}
                    <div className="flex items-center gap-4 sm:gap-6">
                        {/* Theme Toggle Button */}
                        <button 
                            onClick={toggleTheme}
                            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                            aria-label="Toggle dark mode"
                        >
                            {isDarkMode ? (
                                <FaSun className="text-xl text-white" />
                            ) : (
                                <MdDarkMode className="text-xl text-black" />
                            )}
                        </button>
                        
                        {/* Notifications - Only show for Administrator or Technical_Head */}
                        {(userRole === "Administrator" || userRole === "Technical_Head") && (
                            <div
                                className="relative cursor-pointer group"
                                onClick={toggleNotification}
                                role="button"
                                tabIndex={0}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        toggleNotification();
                                    }
                                }}
                                aria-label="View notifications"
                                ref={notificationRef}
                            >
                                <BiBell className={`text-xl sm:text-2xl transition-all duration-300 ${isDarkMode ? "text-white" : "text-black"}`} />
                                {notificationCount > 0 && (
                                    <sup
                                        className={`absolute -top-1 -right-1 text-xs rounded-full px-1.5 py-0.5 ${
                                            isDarkMode ? "bg-red-500 text-white" : "bg-red-500 text-white"
                                        }`}
                                    >
                                        {notificationCount}
                                    </sup>
                                )}
                                {isNotificationOpen && (
                                    <div className={`absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-md shadow-xl border ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-black border-gray-300'} z-20`}>
                                        {notifications.length === 0 ? (
                                            <div className="p-6 text-center">
                                                <BiBell className="text-4xl text-gray-400 mx-auto mb-2" />
                                                <p className="text-gray-500">No notifications at this time</p>
                                            </div>
                                        ) : (
                                            <div className="py-2">
                                                {notifications.map((notificationItem, index) => (
                                                    <div
                                                        key={index}
                                                        className={`p-4 border-b last:border-b-0 transition-all duration-200 ${
                                                            isDarkMode
                                                                ? 'hover:bg-gray-700 border-gray-700'
                                                                : 'hover:bg-gray-50 border-gray-200'
                                                        } ${notificationItem.is_read ? 'opacity-60' : ''}`}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex-1">
                                                                <h4 className="font-semibold text-sm">{notificationItem.customer_name}</h4>
                                                                {notificationItem.is_read ? (
                                                                    <span className="text-xs text-green-500 flex items-center gap-1 mt-1">
                                                                        <BiCheckCircle className="text-sm" />
                                                                        Read
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                                    <BiCheckCircle className="text-sm" />
                                                                        Unread
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-xs font-medium ${
                                                                    notificationItem.days_remaining <= 1
                                                                        ? 'text-red-600'
                                                                        : notificationItem.days_remaining <= 3
                                                                        ? 'text-orange-600'
                                                                        : 'text-yellow-600'
                                                                }`}>
                                                                    {notificationItem.days_remaining} day{notificationItem.days_remaining !== 1 ? 's' : ''} left
                                                                </span>
                                                                {/* Action Buttons */}
                                                                <div className="flex gap-1">
                                                                    {!notificationItem.is_read && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                markNotificationAsRead(notificationItem.id);
                                                                            }}
                                                                            className={`p-1.5 rounded-lg transition-colors ${
                                                                                isDarkMode
                                                                                    ? 'hover:bg-gray-600 text-green-400 hover:text-green-300'
                                                                                    : 'hover:bg-gray-100 text-green-600 hover:text-green-500'
                                                                            }`}
                                                                            title="Mark as read"
                                                                        >
                                                                            <BiCheck className="text-sm" />
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={(e) => handleDeleteNotification(e, notificationItem.id)}
                                                                        className={`p-1.5 rounded-lg transition-colors ${
                                                                            isDarkMode
                                                                                ? 'hover:bg-gray-600 text-red-400 hover:text-red-300'
                                                                                : 'hover:bg-gray-100 text-red-600 hover:text-red-500'
                                                                        }`}
                                                                        title="Delete notification"
                                                                    >
                                                                        <BiTrash className="text-sm" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div
                                                            onClick={() => {
                                                                setIsNotificationOpen(false);
                                                                navigate(`/dashboard/job-home/${notificationItem.job_home_id}`);
                                                                // Mark as read if not already read
                                                                if (!notificationItem.is_read) {
                                                                    markNotificationAsRead(notificationItem.id);
                                                                }
                                                            }}
                                                            className="cursor-pointer"
                                                        >
                                                            <p className="text-xs text-gray-600 mb-1">
                                                                Job: {notificationItem.job_no}
                                                            </p>
                                                            <p className="text-xs mb-1">
                                                                Item: {notificationItem.item_name}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                Expires on: {formatDateTime(notificationItem.expiry_date)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Message - Only show for Administrator or Technical_Head */}
                        {(userRole === "Administrator" || userRole === "Technical_Head") && (
                            <div
                                className="relative cursor-pointer group"
                                onClick={toggleMessage}
                                role="button"
                                tabIndex={0}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        toggleMessage();
                                    }
                                }}
                                aria-label="View messages"
                                ref={messageRef}
                            >
                                <BiMessageCheck className={`text-xl sm:text-2xl transition-all duration-300 ${isDarkMode ? "text-white" : "text-black"}`} />
                                {messageCount > 0 && (
                                    <sup
                                        className={`absolute -top-1 -right-1 text-xs rounded-full px-1.5 py-0.5 ${
                                            isDarkMode ? "bg-red-500 text-white" : "bg-red-500 text-white"
                                        }`}
                                    >
                                        {messageCount}
                                    </sup>
                                )}
                                {isMessageOpen && (
                                    <div className={`absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-md shadow-xl border ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-black border-gray-300'} z-20`}>
                                        {messages.length === 0 ? (
                                            <div className="p-6 text-center">
                                                <BiMessageCheck className="text-4xl text-gray-400 mx-auto mb-2" />
                                                <p className="text-gray-500">No messages at this time</p>
                                            </div>
                                        ) : (
                                            <div className="py-2">
                                                {messages.map((message, index) => (
                                                    <div
                                                        key={index}
                                                        className={`p-4 border-b last:border-b-0 transition-all duration-200 ${
                                                            isDarkMode
                                                                ? 'hover:bg-gray-700 border-gray-700'
                                                                : 'hover:bg-gray-50 border-gray-200'
                                                        } ${message.is_read ? 'opacity-60' : ''}`}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex-1">
                                                                <p className="text-sm font-semibold">
                                                                    Job: {message.job_no ?? message.job_home_id ?? 'N/A'}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-gray-500">
                                                                    {formatDateTime(message.created_at)}
                                                                </span>
                                                                <button
                                                                    onClick={(e) => handleDeleteMessage(e, message.id)}
                                                                    className={`p-1.5 rounded-lg transition-colors ${
                                                                        isDarkMode
                                                                            ? 'hover:bg-gray-600 text-red-400 hover:text-red-300'
                                                                            : 'hover:bg-gray-100 text-red-600 hover:text-red-500'
                                                                    }`}
                                                                    title="Delete message"
                                                                >
                                                                    <BiTrash className="text-sm" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="cursor-pointer"
                                                            onClick={() => {
                                                                setIsMessageOpen(false);
                                                                if (message.job_home_id) {
                                                                    navigate(`/dashboard/job-home/${message.job_home_id}`);
                                                                }
                                                            }}
                                                        >
                                                            <p className="text-xs text-gray-600 mb-1">
                                                                Subject: {message.subject}
                                                            </p>
                                                            <p className="text-xs mb-1">
                                                                {message.content.substring(0, 50)}...
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Profile Dropdown */}
                        <div className="relative" ref={profileRef}>
                            <button 
                                onClick={toggleProfile} 
                                className="flex items-center gap-2 focus:outline-none"
                                aria-expanded={isProfileOpen}
                                aria-controls="profile-menu"
                            >
                                {isLoadingUser ? (
                                    <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse"></div>
                                ) : isValidProfileImage(userProfileImageUrl) ? (
                                    <img
                                        src={userProfileImageUrl}
                                        alt="Profile"
                                        className="rounded-full object-cover border border-gray-400 w-8 h-8"
                                        onError={() => setUserProfileImageUrl(null)}
                                    />
                                ) : (
                                    <BiUserCircle className={`text-xl sm:text-2xl ${isDarkMode ? "text-white" : "text-black"}`} />
                                )}
                                
                                <span className={`hidden md:inline transition-all duration-300 text-sm font-medium ${isDarkMode ? "text-white" : "text-black"}`}>
                                    {isLoadingUser ? 'Loading...' : userFullName}
                                    {userDataError && (
                                        <span className="text-red-500 text-xs ml-1" title={userDataError}>⚠</span>
                                    )}
                                </span>
                            </button>
                            
                            {isProfileOpen && (
                                <div 
                                    id="profile-menu"
                                    className={`absolute top-full right-0 mt-2 w-40 sm:w-48 rounded-md shadow-xl border ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-black border-gray-300'} z-10`}
                                >
                                    <Link to="#" className={`block px-4 py-2 text-sm hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                        Profile
                                    </Link>
                                    <Link to="/dashboard/ProfileSettings" className={`block px-4 py-2 text-sm hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                        Settings
                                    </Link>
                                    <button 
                                        onClick={fetchUserData}
                                        className={`block w-full text-left px-4 py-2 text-sm hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                                    >
                                        Refresh Data
                                    </button>
                                    <hr className={`${isDarkMode ? 'border-gray-700' : 'border-gray-300'} my-2`} />
                                    <Link to="/logout" className={`block px-4 py-2 text-sm hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                        Log Out
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            <hr className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`} />
        </>
    );
};

export default TopDashboard;