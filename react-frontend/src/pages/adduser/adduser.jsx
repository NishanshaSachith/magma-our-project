import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { User, Mail, Lock, Shield, Phone, Eye, EyeOff, UserPlus, Trash2, Edit } from "lucide-react";
import { ThemeContext } from "../../components/ThemeContext/ThemeContext";
import Notification from "../../components/Notification/Notification";
import { useAuth } from "../../pages/hooks/useAuth";
import UserProfileIcon from "../../components/UserProfileIcon/UserProfileIcon";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";
import LoadingItems from "../../components/Loading/LoadingItems";

// A centralized place for API calls
const API_BASE_URL = "http://localhost:8000/api";

// Reusable input component to reduce code repetition
const InputField = ({ label, name, value, onChange, type = "text", placeholder, icon: Icon, required = false, isDarkMode, children, disabled = false }) => {
  const inputBgColor = isDarkMode ? 'bg-gray-800' : 'bg-gray-200';
  const inputTextColor = isDarkMode ? 'text-white' : 'text-gray-800';
  const placeholderColor = isDarkMode ? 'placeholder-gray-400' : 'placeholder-gray-500';
  const iconColor = isDarkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="space-y-2">
      <label className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{label}</label>
      <div className={`relative flex items-center space-x-2 ${inputBgColor} p-3 rounded-lg`}>
        {Icon && <Icon size={20} className={iconColor} />}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`bg-transparent border-none ${inputTextColor} ${placeholderColor} focus:outline-none w-full ${disabled ? 'cursor-not-allowed opacity-75' : ''}`}
          required={required}
          disabled={disabled}
        />
        {children}
      </div>
    </div>
  );
};

// UserCard component to display user information and now the inline form
const UserCard = ({ 
  user, isDarkMode, initiateRoleChange, initiateDeleteUser, initiatePasswordChange, userRole, 
  isPasswordChangeActive, passwordChangeFormData, onPasswordChangeSubmit, onPasswordChangeCancel, onPasswordChangeFormChange, isPasswordChanging 
}) => {
  const cardBg = isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200';
  const textColor = isDarkMode ? 'text-gray-200' : 'text-gray-900';
  const subTextColor = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const iconColor = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const [showPassword, setShowPassword] = useState(false);

  const isRoleSelectDisabled = () => {
    if (userRole === 'Administrator') {
      return false;
    }
    if (userRole === 'Tecnical_Head') {
      return user.role === 'Administrator' || user.role === 'Tecnical_Head';
    }
    return true;
  };

  const isDeleteDisabled = () => {
    if (userRole === 'Administrator') {
      return false;
    }
    if (userRole === 'Tecnical_Head') {
      return user.role === 'Administrator' || user.role === 'Tecnical_Head';
    }
    return true;
  };

  const getRoleOptions = () => {
    if (userRole === 'Administrator') {
      return (
        <>
          <option value="Administrator" className={isDarkMode ? 'bg-gray-600' : 'bg-white'}>Administrator</option>
          <option value="Tecnical_Head" className={isDarkMode ? 'bg-gray-600' : 'bg-white'}>Technical Head</option>
          <option value="Manager" className={isDarkMode ? 'bg-gray-600' : 'bg-white'}>Service Center Manager</option>
          <option value="Technician" className={isDarkMode ? 'bg-gray-600' : 'bg-white'}>Technician</option>
        </>
      );
    }
    if (userRole === 'Tecnical_Head') {
      return (
        <>
          <option value="Manager" className={isDarkMode ? 'bg-gray-600' : 'bg-white'}>Service Center Manager</option>
          <option value="Technician" className={isDarkMode ? 'bg-gray-600' : 'bg-white'}>Technician</option>
          {user.role === 'Administrator' && <option value="Administrator" className={isDarkMode ? 'bg-gray-600' : 'bg-white'} disabled>Administrator</option>}
          {user.role === 'Tecnical_Head' && <option value="Tecnical_Head" className={isDarkMode ? 'bg-gray-600' : 'bg-white'} disabled>Technical Head</option>}
        </>
      );
    }
    return <option value={user.role} className={isDarkMode ? 'bg-gray-600' : 'bg-white'}>{user.role}</option>;
  };

  return (
    <div className={`${cardBg} rounded-lg shadow-md p-6 flex flex-col space-y-4 h-full`}>
      <div className="flex items-center space-x-4">
        <div className="rounded-full bg-blue-800 ">
          <UserProfileIcon user={user} isDarkMode={isDarkMode} size={12} />
        </div>
        <div className="flex-grow">
          <h3 className={`text-lg font-semibold ${textColor} break-words`}>{user.fullname || user.username}</h3>
          <p className={`text-sm ${subTextColor} break-words`}>@{user.username}</p>
        </div>
      </div>

      <div className="space-y-2 flex-grow">
        <div className="flex items-center space-x-2">
          <Mail size={16} className={iconColor} aria-label="Email icon" />
          <p className={`text-sm ${subTextColor} break-words`}>{user.email}</p>
        </div>
        {user.phoneno && (
          <div className="flex items-center space-x-2">
            <Phone size={16} className={iconColor} aria-label="Phone icon" />
            <p className={`text-sm ${subTextColor}`}>{user.phoneno}</p>
          </div>
        )}
        {user.idnumber && (
          <div className="flex items-center space-x-2">
            <Shield size={16} className={iconColor} aria-label="ID icon" />
            <p className={`text-sm ${subTextColor} break-words`}>ID: {user.idnumber}</p>
          </div>
        )}
      </div>

      {isPasswordChangeActive ? (
        // Render the inline password form when active
        <form onSubmit={(e) => onPasswordChangeSubmit(e, user.id)} className="space-y-4 pt-4 border-t-2 border-dashed border-gray-500">
          <h4 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Reset Password</h4>
          <InputField
            label="New Password"
            name="newPassword"
            value={passwordChangeFormData.newPassword}
            onChange={onPasswordChangeFormChange}
            placeholder="Enter new password"
            icon={Lock}
            type={showPassword ? "text" : "password"}
            required
            isDarkMode={isDarkMode}
          >
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center p-1 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </InputField>
          <InputField
            label="Confirm New Password"
            name="confirmNewPassword"
            value={passwordChangeFormData.confirmNewPassword}
            onChange={onPasswordChangeFormChange}
            placeholder="Confirm new password"
            icon={Lock}
            type={showPassword ? "text" : "password"}
            required
            isDarkMode={isDarkMode}
          />
          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={onPasswordChangeCancel}
              className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
              disabled={isPasswordChanging}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors text-white ${isPasswordChanging ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              disabled={isPasswordChanging}
            >
              {isPasswordChanging ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      ) : (
        // Render the action buttons when not in password change mode
        <div className="mt-auto flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <label className={`text-sm font-medium ${subTextColor} whitespace-nowrap`} htmlFor={`role-select-${user.id}`}>Role:</label>
            <select
              id={`role-select-${user.id}`}
              value={user.role}
              onChange={(e) => initiateRoleChange(user, e.target.value)}
              className={`py-1 px-2 rounded-md border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} focus:ring-blue-500 focus:border-blue-500 text-sm w-full`}
              disabled={isRoleSelectDisabled()}
              aria-label={`Change role for ${user.fullname || user.username}`}
            >
              {getRoleOptions()}
            </select>
          </div>
          {(userRole === 'Administrator' ) && (
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => initiatePasswordChange(user)}
              className={`flex items-center justify-center space-x-1 p-2 rounded-md transition-colors w-full sm:w-auto ${isDarkMode ? 'text-blue-400 hover:text-blue-200 hover:bg-blue-900' : 'text-blue-600 hover:text-blue-800 hover:bg-blue-100'}`}
              title="Change Password"
              aria-label={`Change password for ${user.fullname || user.username}`}
            >
              <Lock size={18} />
              <span className="text-sm hidden sm:inline">Password</span>
            </button>
            <button
              onClick={() => initiateDeleteUser(user)}
              className={`flex items-center justify-center space-x-1 p-2 rounded-md transition-colors w-full sm:w-auto ${isDeleteDisabled() ? 'opacity-50 cursor-not-allowed text-gray-500' : 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 hover:bg-red-100 dark:hover:bg-red-900'}`}
              title="Delete User"
              disabled={isDeleteDisabled()}
              aria-label={`Delete user ${user.fullname || user.username}`}
            >
              <Trash2 size={18} />
              <span className="text-sm hidden sm:inline">Remove</span>
            </button>
          </div>)}
        </div>
      )}
    </div>
  );
};


const AddUser = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const { userRole } = useAuth();
  const [formData, setFormData] = useState({
    fullname: "",
    username: "",
    email: "",
    password: "",
    idnumber: "",
    phoneno: "",
    role: "Technician"
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRoleForUpdate, setNewRoleForUpdate] = useState('');
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: 'success' });

  // State to manage which user's inline form is active
  const [activePasswordChangeUserId, setActivePasswordChangeUserId] = useState(null);
  const [passwordChangeFormData, setPasswordChangeFormData] = useState({
    newPassword: '',
    confirmNewPassword: ''
  });
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);

  const authToken = localStorage.getItem('authToken');

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId !== null) {
      fetchUsers();
    }
  }, [currentUserId]);

  const fetchCurrentUser = async () => {
    if (!authToken) {
      setNotification({ message: "Authentication token not found. Please log in.", type: 'error' });
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/user`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setCurrentUserId(response.data.id);
    } catch (error) {
      setNotification({ message: "Failed to fetch current user info.", type: 'error' });
    }
  };

  const fetchUsers = async () => {
    if (!authToken) {
      setNotification({ message: "Authentication token not found. Please log in.", type: 'error' });
      return;
    }
    setLoadingUsers(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const usersData = Array.isArray(response.data) ? response.data : response.data.users;
      const filteredUsers = usersData.filter(user => user.id !== currentUserId);
      setUsers(filteredUsers);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setNotification({ message: "Failed to fetch users: " + errorMessage, type: 'error' });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handlePhoneChange = (e) => {
    const { name, value } = e.target;
    if (/^\d*$/.test(value) && value.length <= 10) {
      setFormData(prevData => ({
        ...prevData,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!authToken) {
      setNotification({ message: "Authentication token not found. Please log in.", type: 'error' });
      setIsSubmitting(false);
      return;
    }
    if (!formData.fullname.trim() || !formData.username.trim() || !formData.email.trim() || !formData.password.trim() || !formData.role.trim()) {
      setNotification({ message: "All required fields must be filled.", type: 'error' });
      setIsSubmitting(false);
      return;
    }
    try {
      const response = await axios.post(
        `${API_BASE_URL}/users`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setNotification({ message: response.data.message || `User ${formData.fullname || formData.email} added successfully!`, type: 'success' });
      setFormData({
        fullname: "",
        username: "",
        email: "",
        password: "",
        idnumber: "",
        phoneno: "",
        role: "Technician"
      });
      fetchUsers();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred.";
      setNotification({ message: `Error: ${errorMessage}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const initiateRoleChange = (user, newRole) => {
    setSelectedUser(user);
    setNewRoleForUpdate(newRole);
    setModalAction('updateRole');
    setShowConfirmModal(true);
  };

  const initiateDeleteUser = (user) => {
    setSelectedUser(user);
    setModalAction('delete');
    setShowConfirmModal(true);
  };

  // Password Change Handlers
  const initiatePasswordChange = (user) => {
    // Set the ID of the user whose form should be open
    setActivePasswordChangeUserId(user.id);
    setPasswordChangeFormData({ newPassword: '', confirmNewPassword: '' });
  };

  const handlePasswordChangeSubmit = async (e, userId) => {
    e.preventDefault();
    setIsPasswordChanging(true);

    if (passwordChangeFormData.newPassword !== passwordChangeFormData.confirmNewPassword) {
      setNotification({ message: "New passwords do not match.", type: 'error' });
      setIsPasswordChanging(false);
      return;
    }
    
    if (!authToken) {
      setNotification({ message: "Authentication token not found. Please log in.", type: 'error' });
      setIsPasswordChanging(false);
      return;
    }
    
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/users/${userId}/password`,
        {
          newPassword: passwordChangeFormData.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setNotification({ message: response.data.message || "Password updated successfully!", type: 'success' });
      setActivePasswordChangeUserId(null); // Close the form
      setPasswordChangeFormData({ newPassword: '', confirmNewPassword: '' });
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to update password. Please check your permissions.";
      setNotification({ message: errorMessage, type: 'error' });
    } finally {
      setIsPasswordChanging(false);
    }
  };

  const handlePasswordChangeCancel = () => {
    setActivePasswordChangeUserId(null);
    setPasswordChangeFormData({ newPassword: '', confirmNewPassword: '' });
  };

  const handleConfirmAction = async () => {
    setShowConfirmModal(false);
    if (!authToken) {
      setNotification({ message: "Authentication token not found. Please log in.", type: 'error' });
      handleCancelAction();
      return;
    }

    if (modalAction === 'updateRole' && selectedUser) {
      try {
        const response = await axios.put(
          `${API_BASE_URL}/users/${selectedUser.id}/role`,
          { role: newRoleForUpdate },
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        setNotification({ message: response.data.message || "Role updated successfully!", type: 'success' });
        fetchUsers();
      } catch (error) {
        const errorMessage = error.response?.data?.message || `Error updating role: ${error.message}`;
        setNotification({ message: errorMessage, type: 'error' });
      }
    } else if (modalAction === 'delete' && selectedUser) {
      try {
        const response = await axios.delete(
          `${API_BASE_URL}/users/${selectedUser.id}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          }
        );
        setNotification({ message: response.data.message || "User deleted successfully!", type: 'success' });
        fetchUsers();
      } catch (error) {
        const errorMessage = error.response?.data?.message || `Error deleting user: ${error.message}`;
        setNotification({ message: errorMessage, type: 'error' });
      }
    }
    handleCancelAction();
  };

  const handleCancelAction = () => {
    setShowConfirmModal(false);
    setSelectedUser(null);
    setNewRoleForUpdate('');
    setModalAction(null);
  };

  const getFormRoleOptions = () => {
    if (userRole === 'Administrator') {
      return (
        <>
          <option value="Administrator">Administrator</option>
          <option value="Tecnical_Head">Technical Head</option>
          <option value="Manager">Service Center Manager</option>
          <option value="Technician">Technician</option>
        </>
      );
    }
    if (userRole === 'Tecnical_Head') {
      return (
        <>
          <option value="Manager">Service Center Manager</option>
          <option value="Technician">Technician</option>
        </>
      );
    }
    return <option value={formData.role}>{formData.role}</option>;
  };

  const inputBgColor = isDarkMode ? 'bg-gray-800' : 'bg-gray-200';

  return (
    <div className={`p-4 sm:p-6 space-y-8 min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className={`${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'} rounded-xl p-6 shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center`}>
        <div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Add and Manage Users</h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Create new users and manage existing ones.</p>
        </div>
      </div>

      <ConfirmationModal
        show={showConfirmModal}
        title={modalAction === 'delete' ? 'Confirm Deletion' : 'Confirm Role Change'}
        message={
          modalAction === 'delete'
            ? `Are you sure you want to delete user ${selectedUser?.fullname || selectedUser?.username || 'this user'}? This action cannot be undone.`
            : `Are you sure you want to change ${selectedUser?.fullname || selectedUser?.username || 'this user'}'s role to ${newRoleForUpdate}?`
        }
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
        isDarkMode={isDarkMode}
      />

      <section className={`${isDarkMode ? "bg-gray-900 border border-gray-800" : "bg-white border border-gray-200"} rounded-xl p-6 shadow-lg`}>
        <h2 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Create a New User</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Full Name"
              name="fullname"
              value={formData.fullname}
              onChange={handleChange}
              placeholder="Enter full name"
              icon={User}
              required
              isDarkMode={isDarkMode}
            />

            <InputField
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter username"
              icon={UserPlus}
              required
              isDarkMode={isDarkMode}
            />

            <InputField
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email"
              icon={Mail}
              type="email"
              required
              isDarkMode={isDarkMode}
            />

            <InputField
              label="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              icon={Lock}
              type={showPassword ? "text" : "password"}
              required
              isDarkMode={isDarkMode}
            >
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center p-1 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </InputField>

            <InputField
              label="ID Card Number"
              name="idnumber"
              value={formData.idnumber}
              onChange={handleChange}
              placeholder="Enter ID card number"
              icon={Shield}
              isDarkMode={isDarkMode}
            />

            <InputField
              label="Phone Number"
              name="phoneno"
              value={formData.phoneno}
              onChange={handlePhoneChange}
              placeholder="Enter phone number"
              icon={Phone}
              isDarkMode={isDarkMode}
            />

            <div className="space-y-2">
              <label className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Role</label>
              <div className={`flex items-center space-x-2 ${inputBgColor} p-3 rounded-lg`}>
                <Edit size={20} className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={`py-1 px-2 rounded-md border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} focus:ring-blue-500 focus:border-blue-500 text-sm w-full`}
                  required
                >
                  {getFormRoleOptions()}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className={`px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-medium transition-colors ${isSubmitting ? 'opacity-75 cursor-wait' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding User...' : 'Add User'}
            </button>
          </div>
        </form>
      </section>

      <hr className={`${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`} />

      <section className={`${isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'} rounded-xl p-6 shadow-lg`}>
        <h2 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Users List</h2>
        {loadingUsers ? (
          <div className="flex justify-center items-center my-8">
            <LoadingItems isDarkMode={isDarkMode} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {users.length > 0 ? (
              users.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  isDarkMode={isDarkMode}
                  initiateRoleChange={initiateRoleChange}
                  initiateDeleteUser={initiateDeleteUser}
                  initiatePasswordChange={initiatePasswordChange}
                  userRole={userRole}
                  isPasswordChangeActive={activePasswordChangeUserId === user.id}
                  passwordChangeFormData={passwordChangeFormData}
                  onPasswordChangeSubmit={handlePasswordChangeSubmit}
                  onPasswordChangeCancel={handlePasswordChangeCancel}
                  onPasswordChangeFormChange={(e) => setPasswordChangeFormData({...passwordChangeFormData, [e.target.name]: e.target.value})}
                  isPasswordChanging={isPasswordChanging}
                />
              ))
            ) : (
              <p className={`col-span-full text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No users found.
              </p>
            )}
          </div>
        )}
      </section>
      <Notification 
        message={notification.message} 
        type={notification.type} 
        onClose={() => setNotification({ message: '', type: 'success' })} 
      />
    </div>
  );
};

export default AddUser;