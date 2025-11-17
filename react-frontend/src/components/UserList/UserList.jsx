import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext'; // Import your AuthContext
import { useNavigate } from 'react-router-dom'; // For redirection
import UserProfileIcon from '../UserProfileIcon/UserProfileIcon';

const UserList = () => {
  const { isAuthenticated, loading, logout } = useAuth(); // Get auth status and logout function
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [apiError, setApiError] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  const API_BASE_URL = 'http://127.0.0.1:8000/api'; // Your Laravel API base URL

  useEffect(() => {
    // Wait until authentication status is determined
    if (loading) {
      return;
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchUsers = async () => {
      try {
        setIsLoadingUsers(true); // Start loading
        setApiError(''); // Clear previous errors

        // Axios is already configured to include the token via AuthContext's useEffect
        const response = await axios.get(`${API_BASE_URL}/users`);
        setUsers(response.data.data); // Assuming Laravel returns { message: ..., data: [...] }
      } catch (error) {
        console.error('Error fetching users:', error);
        if (error.response) {
          // If the server responded with an error (e.g., 401 Unauthorized, 403 Forbidden)
          if (error.response.status === 401 || error.response.status === 403) {
            setApiError('You are not authorized to view this page. Please log in.');
            // Optionally, force logout if the token is invalid
            logout();
            navigate('/login');
          } else if (error.response.data && error.response.data.message) {
            setApiError(error.response.data.message);
          } else {
            setApiError('Failed to fetch users. Server error.');
          }
        } else if (error.request) {
          // The request was made but no response was received
          setApiError('No response from server. Please check your API URL or network connection.');
        } else {
          // Something happened in setting up the request that triggered an Error
          setApiError('An unexpected error occurred: ' + error.message);
        }
      } finally {
        setIsLoadingUsers(false); // End loading
      }
    };

    fetchUsers();
  }, [isAuthenticated, loading, navigate, logout]); // Depend on isAuthenticated, loading, navigate, logout

  if (loading || !isAuthenticated) {
    // Render a loading state or nothing while auth is being checked or if not authenticated
    // The useEffect above will handle redirection once loading is false
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl text-gray-700">Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6 text-center">User List</h1>

        {apiError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {apiError}
          </div>
        )}

        {isLoadingUsers ? (
          <div className="text-center text-gray-600 dark:text-gray-400">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="text-center text-gray-600 dark:text-gray-400">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Created At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                      <UserProfileIcon user={user} isDarkMode={document.body.classList.contains('dark')} size={8} />
                      <span>{user.fullname || user.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;
