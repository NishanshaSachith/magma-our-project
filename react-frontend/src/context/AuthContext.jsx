import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

// Create the AuthContext
const AuthContext = createContext(null);

// AuthProvider component to wrap your application
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // To indicate if initial auth check is done



  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          // Verify token by fetching user data from a protected route
          // This ensures the token is still valid on the backend
          const response = await api.get('/user');
          setUser(response.data.user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Failed to verify token or fetch user:', error);
          // If token is invalid or expired, clear it and reset auth state
          localStorage.removeItem('authToken');
          localStorage.removeItem('user_data');
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
      const response = await api.post('/login', { email, password });
      const { access_token, user } = response.data;

      localStorage.setItem('authToken', access_token);
      localStorage.setItem('user_data', JSON.stringify(user)); // Store user data

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
      await api.post('/logout');
    } catch (error) {
      console.error('Logout failed on backend:', error);
      // Continue with frontend logout even if backend fails, for better UX
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user_data');
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
