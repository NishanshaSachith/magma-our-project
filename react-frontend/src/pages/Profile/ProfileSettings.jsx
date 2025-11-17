import React, { useContext, useState, useEffect, useRef } from 'react';
import { ThemeContext } from '../../components/ThemeContext/ThemeContext';
import { Check, Eye, EyeOff } from 'react-feather';
import { FiUser } from "react-icons/fi"; // For default user icon
import axios from 'axios'; // For API calls
import { useNavigate } from 'react-router-dom';
import Notification from '../../components/Notification/Notification'; // Import the Notification component

// --- IMPORTANT: Configure your API Base URL ---
const API_BASE_URL = 'http://127.0.0.1:8000/api'; // Example: adjust if your backend is on a different port/domain
// ---------------------------------------------

const ProfileSettings = () => {
    const { isDarkMode } = useContext(ThemeContext);
    const navigate = useNavigate();

    // State for current user profile data (what's in the form)
    const [userData, setUserData] = useState({
        id: null,
        fullname: '',
        username: '',
        email: '',
        idnumber: '',
        phoneno: '',
        profile_image_url: null,
    });

    // State to store the ORIGINAL user data fetched from the backend
    const [originalUserData, setOriginalUserData] = useState(null);

    // State for password fields
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // State for password visibility
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // State for profile image management
    const [selectedProfileImageFile, setSelectedProfileImageFile] = useState(null);
    const [isProfileImageRemoved, setIsProfileImageRemoved] = useState(false);
    const profileFileInputRef = useRef(null);

    // UI states for loading, success, and error messages
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccessMessage, setSaveSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // --- EFFECT: Redirect to login if no auth token ---
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate('/login');
            return;
        }
    }, [navigate]);

    // --- EFFECT: Fetch User Profile Data on Component Mount ---
    useEffect(() => {
        const fetchUserProfile = async () => {
            setErrorMessage("");
            try {
                const token = localStorage.getItem('authToken');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};

                const response = await axios.get(`${API_BASE_URL}/profile`, { headers });
                
                const fetchedData = {
                    id: response.data.id,
                    fullname: response.data.fullname || '',
                    username: response.data.username || '',
                    email: response.data.email || '',
                    idnumber: response.data.idnumber || '',
                    phoneno: response.data.phoneno || '',
                    profile_image_url: response.data.profile_image_url || null,
                };
                
                setUserData(fetchedData);
                setOriginalUserData(fetchedData); // Store the fetched data as original
            } catch (error) {
                console.error("Error fetching user profile:", error);
                setErrorMessage("Failed to load profile data. Please try again.");
                if (error.response && error.response.status === 401) {
                    // Handle unauthorized: e.g., redirect to login
                }
            }
        };
        fetchUserProfile();
    }, []);

    // --- HANDLERS: For Input Changes ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // For phoneno, allow only digits and limit length to 10
        if (name === 'phoneno') {
            if (/^\d{0,10}$/.test(value)) {
                setUserData(prevData => ({
                    ...prevData,
                    [name]: value
                }));
            }
        } else {
            setUserData(prevData => ({
                ...prevData,
                [name]: value
            }));
        }
    };

    const handleNewPasswordChange = (e) => setNewPassword(e.target.value);
    const handleConfirmPasswordChange = (e) => setConfirmPassword(e.target.value);

    // --- HANDLERS: For Password Visibility ---
    const toggleNewPasswordVisibility = () => {
        setShowNewPassword(prev => !prev);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(prev => !prev);
    };

    // --- HANDLERS: For Profile Image Management ---
    const handleProfileImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedProfileImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setUserData(prevData => ({
                    ...prevData,
                    profile_image_url: reader.result
                }));
            };
            reader.readAsDataURL(file);
            setIsProfileImageRemoved(false);
        }
    };

    const handleUploadImageButtonClick = () => {
        profileFileInputRef.current.click();
    };

    const handleRemoveProfileImage = () => {
        // Only allow removal if there's an existing image URL or a selected file
        if (userData.profile_image_url || selectedProfileImageFile) {
            setUserData(prevData => ({
                ...prevData,
                profile_image_url: null
            }));
            setSelectedProfileImageFile(null);
            setIsProfileImageRemoved(true); // Flag for backend to remove
        }
    };

    // --- HANDLER: Save Profile ---
    const handleSaveProfile = async () => {
        setIsSaving(true);
        setSaveSuccessMessage("");
        setErrorMessage("");

        if (newPassword && newPassword !== confirmPassword) {
            setErrorMessage("New password and confirmation do not match.");
            setIsSaving(false);
            return;
        }

        const formData = new FormData();
        let changesMade = false;

        // Check each field for changes (excluding ID and profile_image_url)
        const fieldsToCheck = ['fullname', 'username', 'email', 'idnumber', 'phoneno'];
        
        fieldsToCheck.forEach(field => {
            if (originalUserData && userData[field] !== originalUserData[field]) {
                formData.append(field, userData[field] || ''); // Ensure we don't send null/undefined
                changesMade = true;
            }
        });

        // Handle password changes
        if (newPassword && newPassword.trim() !== '') {
            formData.append('new_password', newPassword);
            formData.append('new_password_confirmation', confirmPassword);
            changesMade = true;
        }

        // Handle profile image changes
        if (selectedProfileImageFile) {
            formData.append('profile_image', selectedProfileImageFile);
            changesMade = true;
        } else if (isProfileImageRemoved) {
            formData.append('remove_profile_image', '1'); // Use '1' for true
            changesMade = true;
        }

        // Check if any changes were made
        if (!changesMade) {
            setErrorMessage("No changes detected to save.");
            setIsSaving(false);
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            formData.append('_method', 'PUT'); // Spoof method for Laravel
            const response = await axios.post(`${API_BASE_URL}/profile`, formData, { headers });

            setSaveSuccessMessage(response.data.message);

            // Update both current and original data with the response
            const updatedData = {
                id: response.data.user.id,
                fullname: response.data.user.fullname || '',
                username: response.data.user.username || '',
                email: response.data.user.email || '',
                idnumber: response.data.user.idnumber || '',
                phoneno: response.data.user.phoneno || '',
                profile_image_url: response.data.user.profile_image_url || null,
            };

            setUserData(updatedData);
            setOriginalUserData(updatedData); // This is crucial!
            
            // Clear password fields and image states
            setNewPassword('');
            setConfirmPassword('');
            setSelectedProfileImageFile(null);
            setIsProfileImageRemoved(false);
            setShowNewPassword(false); // Reset password visibility
            setShowConfirmPassword(false); // Reset password visibility

        } catch (error) {
            console.error('Error saving profile:', error);
            if (error.response) {
                if (error.response.data && error.response.data.errors) {
                    const validationErrors = error.response.data.errors;
                    let errorMessages = [];
                    for (const key in validationErrors) {
                        if (validationErrors.hasOwnProperty(key)) {
                            errorMessages = errorMessages.concat(validationErrors[key]);
                        }
                    }
                    setErrorMessage(errorMessages.join('; '));
                } else if (error.response.data && error.response.data.message) {
                    setErrorMessage(error.response.data.message);
                } else {
                    setErrorMessage(`Server error: ${error.response.status} ${error.response.statusText}`);
                }
            } else {
                setErrorMessage("Network error or no response from server. Check your connection.");
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={`min-h-screen p-4 sm:p-6 lg:p-8 transition-all ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'}`}>
            {/* Header Section */}
            <div className={`${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'} rounded-xl p-4 sm:p-6 shadow-lg flex justify-between items-center`}>
                <h1 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Profile Settings</h1>
            </div>

            {/* Notification Components */}
            {saveSuccessMessage && <Notification message={saveSuccessMessage} type="success" onClose={() => setSaveSuccessMessage("")} />}
            {errorMessage && <Notification message={errorMessage} type="error" onClose={() => setErrorMessage("")} />}

            {/* Profile Image Section */}
            <div className={`shadow-md rounded-lg p-4 sm:p-6 mt-6 flex flex-col sm:flex-row items-center sm:space-x-6 space-y-4 sm:space-y-0 transition-all ${isDarkMode ? 'bg-gray-900 border border-gray-600' : 'bg-white border border-gray-300'}`}>
                <div className="flex-shrink-0"> {/* Use flex-shrink-0 to prevent image from shrinking */}
                    {userData.profile_image_url ? (
                        <img
                            src={userData.profile_image_url}
                            alt="Profile"
                            className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-2 border-gray-500"
                        />
                    ) : (
                        <FiUser className="w-24 h-24 sm:w-32 sm:h-32 rounded-full text-gray-400 border-2 border-gray-500 p-2" />
                    )}
                </div>
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <button
                            onClick={handleUploadImageButtonClick}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition-all text-sm sm:text-base w-full sm:w-auto"
                        >
                            Change Image
                        </button>
                        {(userData.profile_image_url || selectedProfileImageFile) && (
                            <button
                                onClick={handleRemoveProfileImage}
                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition-all text-sm sm:text-base w-full sm:w-auto"
                            >
                                Remove
                            </button>
                        )}
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageChange}
                        className="hidden"
                        ref={profileFileInputRef}
                    />
                    <p className="text-xs sm:text-sm dark:text-gray-400 mt-2">PNG or JPG (Max 2MB)</p>
                </div>
            </div>

            {/* Account Settings Section - Personal Information */}
            <div className={`shadow-md rounded-lg p-4 sm:p-6 mt-6 transition-all ${isDarkMode ? 'bg-gray-900 border border-gray-600' : 'bg-white border border-gray-300'}`}>
                <h3 className="text-lg sm:text-xl font-semibold mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                        <label htmlFor="fullname" className="block text-sm dark:text-gray-400 font-bold mb-2">Full Name</label>
                        <input
                            type="text"
                            id="fullname"
                            name="fullname"
                            className={`w-full py-2 px-3 rounded-md border focus:ring-2 focus:outline-none transition-all text-sm sm:text-base ${isDarkMode ? 'bg-gray-800 text-white border-gray-600 focus:ring-blue-500' : 'bg-gray-50 text-gray-800 border-gray-300 focus:ring-blue-400'}`}
                            value={userData.fullname}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <label htmlFor="username" className="block text-sm dark:text-gray-400 font-bold mb-2">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            className={`w-full py-2 px-3 rounded-md border focus:ring-2 focus:outline-none transition-all text-sm sm:text-base ${isDarkMode ? 'bg-gray-800 text-white border-gray-600 focus:ring-blue-500' : 'bg-gray-50 text-gray-800 border-gray-300 focus:ring-blue-400'}`}
                            value={userData.username}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm dark:text-gray-400 font-bold mb-2">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className={`w-full py-2 px-3 rounded-md border focus:ring-2 focus:outline-none transition-all text-sm sm:text-base ${isDarkMode ? 'bg-gray-800 text-white border-gray-600 focus:ring-blue-500' : 'bg-gray-50 text-gray-800 border-gray-300 focus:ring-blue-400'}`}
                            value={userData.email}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <label htmlFor="idnumber" className="block text-sm dark:text-gray-400 font-bold mb-2">ID Number</label>
                        <input
                            type="text"
                            id="idnumber"
                            name="idnumber"
                            className={`w-full py-2 px-3 rounded-md border focus:ring-2 focus:outline-none transition-all text-sm sm:text-base ${isDarkMode ? 'bg-gray-800 text-white border-gray-600 focus:ring-blue-500' : 'bg-gray-50 text-gray-800 border-gray-300 focus:ring-blue-400'}`}
                            value={userData.idnumber}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <label htmlFor="phoneno" className="block text-sm dark:text-gray-400 font-bold mb-2">Phone No</label>
                        <input
                            type="text"
                            id="phoneno"
                            name="phoneno"
                            className={`w-full py-2 px-3 rounded-md border focus:ring-2 focus:outline-none transition-all text-sm sm:text-base ${isDarkMode ? 'bg-gray-800 text-white border-gray-600 focus:ring-blue-500' : 'bg-gray-50 text-gray-800 border-gray-300 focus:ring-blue-400'}`}
                            value={userData.phoneno}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>
            </div>

            {/* Password Settings Section */}
            <div className={`shadow-md rounded-lg p-4 sm:p-6 mt-6 transition-all ${isDarkMode ? 'bg-gray-900 border border-gray-600' : 'bg-white border border-gray-300'}`}>
                <h3 className="text-lg sm:text-xl font-semibold mb-4">Change Password</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* New Password Field */}
                    <div>
                        <label htmlFor="newPassword" className="block text-sm dark:text-gray-400 font-bold mb-2">New Password</label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? "text" : "password"}
                                id="newPassword"
                                name="new_password"
                                className={`w-full py-2 px-3 rounded-md border focus:ring-2 focus:outline-none transition-all text-sm sm:text-base pr-10 ${isDarkMode ? 'bg-gray-800 text-white border-gray-600 focus:ring-blue-500' : 'bg-gray-50 text-gray-800 border-gray-300 focus:ring-blue-400'}`}
                                placeholder="Leave blank to keep current password"
                                value={newPassword}
                                onChange={handleNewPasswordChange}
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={toggleNewPasswordVisibility}
                                className={`absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}
                                aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                            >
                                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    {/* Confirm New Password Field */}
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm dark:text-gray-400 font-bold mb-2">Confirm New Password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                id="confirmPassword"
                                name="new_password_confirmation"
                                className={`w-full py-2 px-3 rounded-md border focus:ring-2 focus:outline-none transition-all text-sm sm:text-base pr-10 ${isDarkMode ? 'bg-gray-800 text-white border-gray-600 focus:ring-blue-500' : 'bg-gray-50 text-gray-800 border-gray-300 focus:ring-blue-400'}`}
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={handleConfirmPasswordChange}
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={toggleConfirmPasswordVisibility}
                                className={`absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}
                                aria-label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"}
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end mt-6">
                <button
                    onClick={handleSaveProfile}
                    className={`px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-medium transition-colors ${isSaving ? 'opacity-75 cursor-wait' : ''}`}
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving Changes...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};

export default ProfileSettings;