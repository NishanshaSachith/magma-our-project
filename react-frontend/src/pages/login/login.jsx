import React, { useState, useContext } from 'react';
import { FaEye, FaEyeSlash, FaGoogle, FaFacebookF, FaGithub, FaMoon, FaSun } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from "../../components/ThemeContext/ThemeContext";
import axios from 'axios';

const LoginPage = () => {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        email: formData.email,
        password: formData.password,
      });

      if (response.status === 200) {
        setSuccess(true);
        setError('');

        const { access_token, user } = response.data;
        localStorage.setItem('authToken', access_token);
        localStorage.setItem('user', JSON.stringify(user));

        console.log('Login successful:', response.data);

        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.response) {
        if (err.response.status === 422) {
          setError('Invalid credentials. Please check your email and password.');
        } else if (err.response.data?.message) {
          setError(err.response.data.message);
        } else {
          setError('An unexpected error occurred during login.');
        }
      } else if (err.request) {
        setError('No response from server. Please check your network connection.');
      } else {
        setError('Error: ' + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-blue-50 to-purple-50 transition-colors duration-500 ${isDarkMode ? 'dark:from-gray-900 dark:to-gray-800' : ''}`}
    >
      <div
        className={`w-full max-w-sm sm:max-w-md bg-white bg-opacity-90 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 ${isDarkMode ? 'dark:bg-gray-800 dark:bg-opacity-90 dark:border dark:border-gray-700' : ''}`}
      >
        {/* Card Header with responsive spacing */}
        <div className="p-6 sm:p-8 relative">
          <h2 className="text-center text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Welcome back
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
            Sign in to your account
          </p>
          {/* Dark Mode Toggle - always visible */}
          <button
            type="button"
            className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-2 transition-transform duration-200 hover:scale-110"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <FaSun className="h-5 w-5" /> : <FaMoon className="h-5 w-5" />}
          </button>
        </div>

        {/* Card Body with responsive padding */}
        <div className="p-6 sm:p-8">
          {success && (
            <div className="bg-green-100 dark:bg-green-800 border border-green-400 text-green-700 dark:text-green-200 p-4 rounded-lg mb-6 text-sm">
              Login successful! Redirecting to your dashboard...
            </div>
          )}
          {error && (
            <div className="bg-red-100 dark:bg-red-800 border border-red-400 text-red-700 dark:text-red-200 p-4 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ${isDarkMode ? 'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-500' : ''}`}
                  placeholder="example@domain.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ${isDarkMode ? 'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-500' : ''}`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                
                <label htmlFor="remember-me" className="ml-2 block text-gray-700 dark:text-gray-200">
                  Forgot password? Please contact admin
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-white font-medium bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-all duration-200 ${isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:-translate-y-1'}`}
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  'Log in'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;