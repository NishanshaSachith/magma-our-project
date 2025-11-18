// src/pages/AddItem.jsx
import React, { useState, useEffect, useContext } from "react";
import { Check, Tag, Trash2, Edit, Save, X, WifiOff } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { ThemeContext } from "../../components/ThemeContext/ThemeContext";
import api from '../../services/api';
import Notification from '../../components/Notification/Notification';
// Import the ConfirmationModal component from its new file
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";
import LoadingItems from "../../components/Loading/LoadingItems";


const AddItem = () => {
    const { isDarkMode } = useContext(ThemeContext);

    const [formData, setFormData] = useState({
        itemName: "",
        serviceTimeout: "",
        icon: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [items, setItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(false);
    const [editingItemId, setEditingItemId] = useState(null);
    const [editFormData, setEditFormData] = useState({
        itemName: "",
        serviceTimeout: "",
        icon: "",
    });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDeleteId, setItemToDeleteId] = useState(null);
    const [itemToDeleteName, setItemToDeleteName] = useState("");
    const [notification, setNotification] = useState({ message: "", type: "" });

    const showNotification = (message, type) => {
        setNotification({ message, type });
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            setLoadingItems(true);
            const response = await api.get('/items');
            setItems(response.data);
        } catch (error) {
            console.error("Error fetching items:", error);
            const msg = "Failed to fetch items. " + (error.response?.data?.message || error.message);
            showNotification(msg, "error");
        } finally {
            setLoadingItems(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setNotification({ message: "", type: "" });

        try {
            const response = await api.post(
                "/items",
                {
                    itemName: formData.itemName,
                    serviceTimeout: formData.serviceTimeout,
                    icon: formData.icon,
                }
            );

            if (response.status === 201) {
                const msg = `Item "${formData.itemName || "New Item"}" has been added successfully!`;
                showNotification(msg, "success");
                setFormData({
                    itemName: "",
                    serviceTimeout: "",
                    icon: "",
                });
                fetchItems();
            }
        } catch (error) {
            console.error("Error adding item:", error);
            let errorMsg = "Failed to add item. ";
            if (error.response) {
                if (error.response.status === 422) {
                    const errors = error.response.data.errors;
                    errorMsg = "Validation failed. Please correct the following errors:\n";
                    for (const key in errors) {
                        if (errors.hasOwnProperty(key)) {
                            errorMsg += `- ${key}: ${errors[key].join(', ')}\n`;
                        }
                    }
                } else {
                    errorMsg += error.response.data.message ||
                        `Server Error: ${error.response.status} ${error.response.statusText}`;
                }
            } else if (error.request) {
                errorMsg += "Network Error: No response from server. Please check if the backend is running and accessible.";
            } else {
                errorMsg += `Client Error: ${error.message}`;
            }
            showNotification(errorMsg, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (id, name) => {
        setItemToDeleteId(id);
        setItemToDeleteName(name);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        setShowDeleteModal(false);
        if (!itemToDeleteId) return;

        try {
            setNotification({ message: "", type: "" });

            console.log('Making DELETE request to:', `/api/items/${itemToDeleteId}`);

            const response = await api.delete(`/items/${itemToDeleteId}`);

            console.log('Delete response:', response);

            if (response.status === 200 || response.status === 204) {
                const msg = `Item "${itemToDeleteName}" deleted successfully.`;
                showNotification(msg, "success");
                setItems(prevItems => prevItems.filter(item => item.id !== itemToDeleteId));
                setTimeout(() => fetchItems(), 500);
            } else {
                console.warn('Unexpected response status:', response.status);
                const msg = `Unexpected response: ${response.status}`;
                showNotification(msg, "error");
            }

        } catch (error) {
            console.error("Full error object:", error);
            console.error("Error response:", error.response);
            console.error("Error request:", error.request);
            console.error("Error message:", error.message);

            let errorMsg = "Failed to delete item. ";

            if (error.response) {
                console.error("Server error status:", error.response.status);
                console.error("Server error data:", error.response.data);

                switch (error.response.status) {
                    case 401:
                        errorMsg += "Unauthorized. Please log in again.";
                        break;
                    case 403:
                        errorMsg += "Forbidden. You don't have permission to delete this item.";
                        break;
                    case 404:
                        errorMsg += "Item not found. It may have already been deleted. Refreshing list...";
                        fetchItems();
                        break;
                    case 500:
                        errorMsg += "Server error. Please try again later.";
                        break;
                    default:
                        errorMsg += error.response.data?.message ||
                            `Server error: ${error.response.status} ${error.response.statusText}`;
                }
            } else if (error.request) {
                errorMsg += "Network error. Please check your connection and ensure the server is running.";
            } else {
                errorMsg += `Request error: ${error.message}`;
            }

            showNotification(errorMsg, "error");
        } finally {
            setItemToDeleteId(null);
            setItemToDeleteName("");
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setItemToDeleteId(null);
        setItemToDeleteName("");
        console.log('Delete cancelled by user via modal');
    };

    const startEditing = (item) => {
        setEditingItemId(item._id);
        setEditFormData({
            itemName: item.name,
            serviceTimeout: item.service_timeout || "",
            icon: item.icon || "",
        });
    };

    const cancelEditing = () => {
        setEditingItemId(null);
        setEditFormData({
            itemName: "",
            serviceTimeout: "",
            icon: "",
        });
        fetchItems();
    };

    const saveEdit = async (id) => {
        try {
            setNotification({ message: "", type: "" });
            const response = await api.put(
                `/items/${id}`,
                {
                    itemName: editFormData.itemName,
                    serviceTimeout: editFormData.serviceTimeout,
                    icon: editFormData.icon,
                }
            );
            if (response.status === 200) {
                const msg = "Item updated successfully.";
                showNotification(msg, "success");
                setEditingItemId(null);
                fetchItems();
            }
        } catch (error) {
            console.error("Error updating item:", error);
            const msg = "Failed to update item. " + (error.response?.data?.message || error.message);
            showNotification(msg, "error");
        }
    };

    const inputBgColor = isDarkMode ? "bg-gray-800" : "bg-gray-200";
    const inputTextColor = isDarkMode ? "text-white" : "text-gray-800";
    const placeholderColor = isDarkMode
        ? "placeholder-gray-400"
        : "placeholder-gray-500";

    const renderLucideIcon = (iconName, size = 20, className = "") => {
        const IconComponent = LucideIcons[iconName];
        if (IconComponent) {
            return <IconComponent size={size} className={className} />;
        }
        return <Tag size={size} className={`${className} text-red-500`} />;
    };

    return (
        <div
            className={`${
                isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
            } space-y-6 p-4 sm:p-6 min-h-screen flex flex-col`}
        >
            {notification.message && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                />
            )}

            <div className={`${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'} rounded-xl p-6 shadow-lg flex justify-between items-center`}>
                <div>
                    <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Add Item</h1>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Create a new Item</p>
                </div>
            </div>

            <div
                className={`${
                    isDarkMode
                        ? "bg-gray-900 border border-gray-800"
                        : "bg-white border border-gray-200"
                } rounded-xl p-6 shadow-lg`}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label
                                className={`text-sm ${
                                    isDarkMode ? "text-gray-400" : "text-gray-600"
                                }`}
                            >
                                Item Name
                            </label>
                            <div
                                className={`flex items-center space-x-2 ${inputBgColor} p-3 rounded-lg`}
                            >
                                <Tag
                                    size={20}
                                    className={`${
                                        isDarkMode ? "text-gray-400" : "text-gray-500"
                                    }`}
                                />
                                <input
                                    type="text"
                                    name="itemName"
                                    value={formData.itemName}
                                    onChange={handleChange}
                                    placeholder="Enter item name"
                                    className={`bg-transparent border-none ${inputTextColor} ${placeholderColor} focus:outline-none w-full`}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label
                                className={`text-sm ${
                                    isDarkMode ? "text-gray-400" : "text-gray-600"
                                }`}
                            >
                                Service Timeout
                            </label>
                            <div
                                className={`flex items-center space-x-2 ${inputBgColor} p-3 rounded-lg`}
                            >
                                <WifiOff
                                    size={20}
                                    className={`${
                                        isDarkMode ? "text-gray-400" : "text-gray-500"
                                    }`}
                                />
                                <input
                                    type="text"
                                    name="serviceTimeout"
                                    value={formData.serviceTimeout}
                                    onChange={handleChange}
                                    placeholder="e.g., Enter Days"
                                    className={`bg-transparent border-none ${inputTextColor} ${placeholderColor} focus:outline-none w-full`}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label
                                className={`text-sm ${
                                    isDarkMode ? "text-gray-400" : "text-gray-600"
                                }`}
                            >
                                Icon
                            </label>
                            <div
                                className={`flex items-center space-x-2 ${inputBgColor} p-3 rounded-lg`}
                            >
                                <span>
                                    {renderLucideIcon(
                                        formData.icon,
                                        20,
                                        isDarkMode ? "text-blue-400" : "text-blue-500"
                                    )}
                                </span>
                                <input
                                    type="text"
                                    name="icon"
                                    value={formData.icon}
                                    onChange={handleChange}
                                    placeholder="Enter Lucide Icon name (e.g., Clock)"
                                    className={`bg-transparent border-none ${inputTextColor} ${placeholderColor} focus:outline-none w-full`}
                                />
                            </div>
                            <p
                                className={`text-xs ${
                                    isDarkMode ? "text-gray-500" : "text-gray-700"
                                }`}
                            >
                                <b>You can add these Icon Names :</b><br></br>FaFaucet , Unplug , Hammer , GiMechanicGarage , BatteryCharging , AirVent , SunDim , MonitorCog , Wind , Cable , Bug , Cog , Phone , Volume2 , Wrench , Waves , Tag
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className={`px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-medium transition-colors ${
                                isSubmitting ? "opacity-75 cursor-wait" : ""
                            }`}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Adding Item..." : "Add Item"}
                        </button>
                    </div>
                </form>
            </div>

            <div
                className={`${
                    isDarkMode
                        ? "bg-gray-900 border border-gray-800"
                        : "bg-white border border-gray-200"
                } rounded-xl p-6 shadow-lg mb-6 flex-grow overflow-auto mt-4`}
            >
                <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Items List</h2>
                {loadingItems ? (
                    <div className="flex justify-center items-center my-8">
                        <LoadingItems isDarkMode={isDarkMode} />
                    </div>
                ) : items.length === 0 ? (
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No items found.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((item) => (
                            <div
                                key={item._id}
                                className={`${
                                    isDarkMode
                                        ? "bg-gray-800 border border-gray-700"
                                        : "bg-gray-50 border border-gray-200"
                                } rounded-lg p-4 shadow-sm flex flex-col`}
                            >
                                {editingItemId === item._id ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-2">
                                            <label htmlFor={`edit-itemName-${item.id}`} className="text-sm font-medium w-24">Name:</label>
                                            <input
                                                id={`edit-itemName-${item.id}`}
                                                type="text"
                                                name="itemName"
                                                value={editFormData.itemName}
                                                onChange={handleEditChange}
                                                className={`border p-2 rounded-md flex-grow ${inputTextColor} ${inputBgColor}`}
                                            />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <label htmlFor={`edit-serviceTimeout-${item.id}`} className="text-sm font-medium w-24">Timeout:</label>
                                            <input
                                                id={`edit-serviceTimeout-${item.id}`}
                                                type="text"
                                                name="serviceTimeout"
                                                value={editFormData.serviceTimeout}
                                                onChange={handleEditChange}
                                                className={`border p-2 rounded-md flex-grow ${inputTextColor} ${inputBgColor}`}
                                            />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <label htmlFor={`edit-icon-${item.id}`} className="text-sm font-medium w-24">Icon:</label>
                                            <div className={`flex items-center space-x-2 border p-2 rounded-md flex-grow ${inputBgColor}`}>
                                                {renderLucideIcon(
                                                    editFormData.icon,
                                                    20,
                                                    isDarkMode ? "text-blue-400" : "text-blue-500"
                                                )}
                                                <input
                                                    id={`edit-icon-${item.id}`}
                                                    type="text"
                                                    name="icon"
                                                    value={editFormData.icon}
                                                    onChange={handleEditChange}
                                                    placeholder="Lucide Icon"
                                                    className={`bg-transparent border-none ${inputTextColor} ${placeholderColor} focus:outline-none w-full`}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end space-x-2 mt-4">
                                                <button
                                                    onClick={() => saveEdit(item._id)}
                                                    className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
                                                    title="Save"
                                                >
                                                    <Save size={18} />
                                                </button>
                                            <button
                                                onClick={cancelEditing}
                                                className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                                                title="Cancel"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                {renderLucideIcon(
                                                    item.icon,
                                                    24,
                                                    isDarkMode ? "text-blue-400" : "text-blue-600"
                                                )}
                                                <h3 className="text-lg font-semibold">{item.name}</h3>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => startEditing(item)}
                                                    className={`p-2 rounded-full ${isDarkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-gray-200'} transition-colors`}
                                                    title="Edit"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(item._id, item.name)}
                                                    className={`p-2 rounded-full ${isDarkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-gray-200'} transition-colors`}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            <span className="font-medium">Timeout:</span> {item.service_timeout || "N/A"}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmationModal
                show={showDeleteModal}
                title="Confirm Deletion"
                message={`Are you sure you want to delete "${itemToDeleteName}"? This action cannot be undone.`}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
                isDarkMode={isDarkMode}
            />
        </div>
    );
};

export default AddItem;