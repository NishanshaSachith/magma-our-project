import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../../components/ThemeContext/ThemeContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import LoadingItems from '../../components/Loading/LoadingItems';
import { BiBell, BiArrowBack, BiCheck, BiTrash, BiCheckCircle } from 'react-icons/bi';

const NotificationPage = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.count || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    navigate(`/dashboard/job-home/${notification.job_home_id}`);
    // Mark as read if not already read
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      // Update the local state to mark as read
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
      // Update unread count
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAsRead = async (e, notificationId) => {
    e.stopPropagation(); // Prevent triggering the notification click
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      // Update the local state to mark as read
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
      // Update unread count
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      // You could show a toast notification here
    }
  };

  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation(); // Prevent triggering the notification click
    try {
      // Find the notification to check if it was unread
      const notificationToDelete = notifications.find(n => n.id === notificationId);
      await api.delete(`/notifications/${notificationId}`);
      // Remove from local state
      setNotifications(prevNotifications =>
        prevNotifications.filter(notification => notification.id !== notificationId)
      );
      // Update unread count if the deleted notification was unread
      if (notificationToDelete && !notificationToDelete.is_read) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      // You could show a toast notification here
    }
  };

  const getUrgencyColor = (daysRemaining) => {
    if (daysRemaining <= 1) return 'text-red-600';
    if (daysRemaining <= 3) return 'text-orange-600';
    return 'text-yellow-600';
  };

  if (loading) {
    return (
      <LoadingItems isDarkMode={isDarkMode} message="Loading notifications..." size="large" />
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'} transition-colors`}
            >
              <BiArrowBack className="text-xl" />
            </button>
            <div className="flex items-center gap-2">
              <BiBell className="text-2xl" />
              <h1 className="text-2xl font-bold">Notifications</h1>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <BiBell className="text-6xl text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-500">No notifications at this time</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification, index) => (
              <div
                key={index}
                className={`p-6 rounded-lg shadow-md transition-all duration-200 ${
                  isDarkMode
                    ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                    : 'bg-white hover:bg-gray-50 border border-gray-200'
                } ${notification.is_read ? 'opacity-60' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{notification.customer_name}</h3>
                    {notification.is_read ? (
                      <span className="text-xs text-green-500 flex items-center gap-1 mt-1">
                        <BiCheckCircle className="text-sm" />
                        Read
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        not read
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${getUrgencyColor(notification.days_remaining)}`}>
                      {notification.days_remaining} day{notification.days_remaining !== 1 ? 's' : ''} left
                    </span>
                    {/* Action Buttons */}
                    <div className="flex gap-1">
                      {!notification.is_read && (
                        <button
                          onClick={(e) => handleMarkAsRead(e, notification.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            isDarkMode
                              ? 'hover:bg-gray-600 text-green-400 hover:text-green-300'
                              : 'hover:bg-gray-100 text-green-600 hover:text-green-500'
                          }`}
                          title="Mark as read"
                        >
                          <BiCheck className="text-lg" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDeleteNotification(e, notification.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDarkMode
                            ? 'hover:bg-gray-600 text-red-400 hover:text-red-300'
                            : 'hover:bg-gray-100 text-red-600 hover:text-red-500'
                        }`}
                        title="Delete notification"
                      >
                        <BiTrash className="text-lg" />
                      </button>
                    </div>
                  </div>
                </div>
                <div
                  onClick={() => handleNotificationClick(notification)}
                  className="cursor-pointer"
                >
                  <p className="text-sm text-gray-600 mb-2">
                    Job: {notification.job_no}
                  </p>
                  <p className="text-sm mb-2">
                    Item: {notification.item_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Expires on: {new Date(notification.expiry_date).toLocaleDateString()}
                  </p>
                  <div className="mt-3 text-xs text-blue-500 hover:text-blue-600">
                    Click to view job details →
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;
