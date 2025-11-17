// src/hooks/useAuth.js
import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      const storedAuthToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');
     
      if (storedAuthToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log("Initializing - Full parsed user object:", parsedUser);
          console.log("Initializing - Available properties:", Object.keys(parsedUser));
          console.log("Initializing - Parsed User Role:", parsedUser.role);
          setUser(parsedUser);
          setUserRole(parsedUser.role || "");
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Failed to parse user data from local storage:", error);
          localStorage.clear();
          setIsAuthenticated(false);
          setUser(null);
          setUserRole("");
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setUserRole("");
      }
      setIsLoading(false);
    };

    // Initialize auth state
    initializeAuth();

    // Handle storage changes from other tabs/windows
    const handleStorageChange = (event) => {
      // Only respond to changes in authToken or user
      if (event.key === 'authToken' || event.key === 'user') {
        console.log("Storage change detected for key:", event.key);
        setIsLoading(true);
        
        const updatedAuthToken = localStorage.getItem('authToken');
        const updatedUser = localStorage.getItem('user');
       
        if (updatedAuthToken && updatedUser) {
          try {
            const parsedUser = JSON.parse(updatedUser);
            console.log("Storage change - Full parsed user object:", parsedUser);
            console.log("Storage change - Available properties:", Object.keys(parsedUser));
            console.log("Storage change - Updated User Role:", parsedUser.role);
            setUser(parsedUser);
            setUserRole(parsedUser.role || "");
            setIsAuthenticated(true);
          } catch (error) {
            console.error("Failed to parse user data on storage change:", error);
            localStorage.clear();
            setIsAuthenticated(false);
            setUser(null);
            setUserRole("");
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setUserRole("");
        }
        setIsLoading(false);
      }
    };

    // Add event listener for storage changes
    window.addEventListener('storage', handleStorageChange);

    // Cleanup function
    return () => {
      console.log("useAuth cleanup - Current userRole at cleanup:", userRole);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Empty dependency array

  // Debug effect to track userRole changes
  useEffect(() => {
    if (!isLoading) {
      console.log("UserRole updated:", userRole);
    }
  }, [userRole, isLoading]);

  return { isAuthenticated, user, userRole, isLoading };
};