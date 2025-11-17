import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Create the AuthContext
const AuthContext = createContext(null);

// AuthProvider component to wrap your application
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // To indicate if initial auth check is done

  // Define your Laravel API base URL. Make sure this matches your backend.
  const API_BASE_URL = 'http://127.0.0.1:8000/api';

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          // Set authorization header for all subsequent axios requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          // Verify token by fetching user data from a protected route
          // This ensures the token is still valid on the backend
          const response = await axios.get(`${API_BASE_URL}/user`);
          setUser(response.data.user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Failed to verify token or fetch user:', error);
          // If token is invalid or expired, clear it and reset auth state
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          delete axios.defaults.headers.common['Authorization']; // Remove header
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      setLoading(false); // Initial authentication check is complete
    };

    checkAuth();
  }, []); // Run only once on component mount

  // Login function to be called from LoginPage
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, { email, password });
      const { access_token, user } = response.data;

      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('user_data', JSON.stringify(user)); // Store user data

      // Set default Authorization header for all future axios requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setIsAuthenticated(true);
      setUser(user);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      setIsAuthenticated(false);
      setUser(null);
      // Construct error message from server response
      if (error.response && error.response.data && error.response.data.errors && error.response.data.errors.email) {
        return { success: false, error: error.response.data.errors.email[0] };
      }
      if (error.response && error.response.data && error.response.data.message) {
         return { success: false, error: error.response.data.message };
      }
      return { success: false, error: 'An unexpected error occurred during login.' };
    }
  };

  // Logout function to be called from LogoutPage or anywhere else
  const logout = async () => {
    try {
      // Send logout request to backend to revoke the token
      // This route requires authentication via the token
      await axios.post(`${API_BASE_URL}/logout`);
    } catch (error) {
      console.error('Logout failed on backend:', error);
      // Continue with frontend logout even if backend fails, for better UX
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      delete axios.defaults.headers.common['Authorization']; // Remove default header
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily access AuthContext values
export const useAuth = () => {
  return useContext(AuthContext);
};
