import React, { useState, useContext, useEffect, useRef } from "react";
import { User, Mail, Phone, Check, XCircle, Trash2, Edit, Search, Calendar, MapPin, Building2 } from "lucide-react";
// Assuming ThemeContext is available from your project structure
import { ThemeContext } from "../../components/ThemeContext/ThemeContext";
import Notification from '../../components/Notification/Notification'; // Import the Notification component
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";
import LoadingItems from "../../components/Loading/LoadingItems";

// Placeholder for ThemeContext if not available

// New CustomerCard Component for a card-style display
const CustomerCard = ({ customer, isDarkMode, handleEdit, handleDeleteClick }) => {
  const cardBg = isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200';
  const textColor = isDarkMode ? 'text-gray-200' : 'text-gray-900';
  const subTextColor = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const iconColor = isDarkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`${cardBg} rounded-lg shadow-md p-6 flex flex-col space-y-4`}>
      <div className="flex items-center space-x-4">
        <User size={24} className={`${iconColor} flex-shrink-0`} />
        <div>
          <h3 className={`text-lg font-semibold ${textColor}`}>{customer.customer_name || 'N/A'}</h3>
          <p className={`text-sm ${subTextColor}`}>Customer ID: {customer.customer_id || 'N/A'}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Mail size={16} className={iconColor} />
          <p className={`text-sm ${subTextColor}`}>{customer.email || 'N/A'}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Phone size={16} className={iconColor} />
          <p className={`text-sm ${subTextColor}`}>{customer.phone || 'N/A'}</p>
        </div>
        {customer.address && (
          <div className="flex items-start space-x-2">
            <MapPin size={16} className={`${iconColor} mt-0.5 flex-shrink-0`} />
            <p className={`text-sm ${subTextColor} line-clamp-3 break-words`}>{customer.address}</p>
          </div>
        )}
        {customer.idnumber && (
          <div className="flex items-center space-x-2">
            <MapPin size={16} className={iconColor} />
            <p className={`text-sm ${subTextColor}`}>ID Card: {customer.idnumber}</p>
          </div>
        )}
        {customer.createdAt && (
          <div className="flex items-center space-x-2">
            <Calendar size={16} className={iconColor} />
            <p className={`text-sm ${subTextColor}`}>Added: {new Date(customer.createdAt).toLocaleDateString()}</p>
          </div>
        )}
      </div>

      {customer.areas && customer.areas.length > 0 && (
        <div className="border-t pt-4 mt-auto"> {/* mt-auto pushes actions to bottom */}
          <h4 className={`text-base font-semibold mb-2 ${textColor}`}>Areas & Branches:</h4>
          <ul className="space-y-2">
            {customer.areas.map((area, idx) => (
              <li key={idx}>
                <div className="flex items-start space-x-2">
                  <Building2 size={16} className={`${iconColor} mt-0.5`} />
                  <div className={`text-sm ${subTextColor}`}>
                    <strong>{area.areaName || ''}:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5">
                      {area.branches && area.branches.length > 0 ? (
                        area.branches.map((branch, bIdx) => (
                          <li key={bIdx}>{branch.branchName || ''} {branch.branchPhone ? `(${branch.branchPhone})` : ''}</li>
                        ))
                      ) : (
                        <li>No branches defined</li>
                      )}
                    </ul>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end space-x-3 mt-4">
        <button
          onClick={() => handleEdit(customer)}
          className="text-blue-600 hover:text-blue-900 transition-colors p-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900"
          title="Edit Customer"
        >
          <Edit size={20} />
        </button>
        <button
          onClick={() => handleDeleteClick(customer)}
          className="text-red-600 hover:text-red-900 transition-colors p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900"
          title="Delete Customer"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
};


const AddCustomer = () => {
  const { isDarkMode } = useContext(ThemeContext);

  // Form data for adding/editing a customer
  const [formData, setFormData] = useState({
    customerName: "",
    address: "",
    email: "",
    phone: "",
  });

  // State for dynamic areas and branches associated with a customer
  const [areas, setAreas] = useState([
    {
      areaName: "",
      branches: [
        {
          branchName: "",
          branchPhone: "",
        },
      ],
    },
  ]);
  // State for available areas fetched from API (used for reference, not form fields)
  const [availableAreas, setAvailableAreas] = useState([]);

  // Main list of all customers fetched from the API
  const [customers, setCustomers] = useState([]);
  // Loading state for customers
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  // Filtered list of customers based on search term
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  // Search term input
  const [searchTerm, setSearchTerm] = useState("");

  // UI feedback states
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  // To disable submit button during API calls
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Stores the ID of the customer currently being edited
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  // Removed isEditing state as areas and branches section should always be visible

  // States for the delete confirmation modal
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  // Refs for focusing after successful submission
  const customerNameInputRef = useRef(null);

  // All available districts in Sri Lanka
  const allDistricts = [
    "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", 
    "Gampaha", "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle", 
    "Kilinochchi", "Kurunegala", "Mannar", "Matale", "Matara", "Monaragala", 
    "Mullaitivu", "Nuwara Eliya", "Polonnaruwa", "Puttalam", "Ratnapura", 
    "Trincomalee", "Vavuniya"
  ];

  // Function to get available districts for new areas (excludes already assigned districts)
  const getAvailableDistricts = () => {
    if (!editingCustomerId) {
      // If not editing, show all districts except those already selected in current form
      const selectedAreas = areas.map(area => area.areaName).filter(name => name);
      return allDistricts.filter(district => !selectedAreas.includes(district));
    }
    
    // If editing, show only districts not already assigned to the customer
    const assignedAreas = areas.map(area => area.areaName).filter(name => name);
    return allDistricts.filter(district => !assignedAreas.includes(district));
  };

  // Effect hook to fetch areas and customers on component mount
  useEffect(() => {
    // Reset form fields on component mount to ensure empty form after reload
    setFormData({
      customerName: "",
      address: "",
      email: "",
      phone: "",
    });
    setAreas([
      {
        areaName: "",
        branches: [
          {
            branchName: "",
            branchPhone: "",
          },
        ],
      },
    ]);
    setEditingCustomerId(null);

    fetchAreas();
    fetchCustomers();
  }, []);

  // Effect hook to filter customers whenever the customers list or search term changes
  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = customers.filter(customer =>
      // Search by customer name
      (customer.customer_name && customer.customer_name.toLowerCase().includes(lowerCaseSearchTerm)) ||
      // Search by email
      (customer.email && customer.email.toLowerCase().includes(lowerCaseSearchTerm)) ||
      // Search by phone
      (customer.phone && customer.phone.toLowerCase().includes(lowerCaseSearchTerm)) ||
      // Search by area name within customer's areas (handle area_name key)
      customer.areas.some(area =>
        ((area.areaName || area.area_name) && (area.areaName || area.area_name).toLowerCase().includes(lowerCaseSearchTerm)) ||
        // Search by branch name or phone within customer's areas and branches (handle branch_name key)
        area.branches.some(branch =>
          ((branch.branchName || branch.branch_name) && (branch.branchName || branch.branch_name).toLowerCase().includes(lowerCaseSearchTerm)) ||
          (branch.branchPhone && branch.branchPhone.toLowerCase().includes(lowerCaseSearchTerm))
        )
      )
    );
    setFilteredCustomers(filtered);
  }, [customers, searchTerm]);

  // Fetches area data from the API
  const fetchAreas = async () => {
    try {
      // In a real application, you would replace this with an actual fetch.
      const response = await fetch("/api/areas"); // Replace with your actual API endpoint
      if (!response.ok) {
        throw new Error(`Failed to fetch areas: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();

      // Convert API response format to match state structure if needed
      // Assuming your API returns data like: [{ area_name: "...", branches: [{ branch_name: "...", branch_phoneno: "..." }] }]
      const normalizedAreas = data.map((area) => ({
        areaName: area.area_name || "",
        branches: area.branches
          ? area.branches.map(b => ({
              branchName: b.branch_name || "",
              branchPhone: b.branch_phoneno || "",
            }))
          : [],
      }));

      setAvailableAreas(normalizedAreas);
    } catch (error) {
      console.error("Error fetching areas:", error);
      setErrorMessage("Failed to fetch areas: " + error.message);
    }
  };

  // Fetches customer data from the API
  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      // In a real application, replace with a fetch to your actual backend.
      const response = await fetch("/api/customers"); // Replace with your actual API endpoint
      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      // Ensure 'id' is mapped to 'customer_id' and 'createdAt' is present
      const processedData = data.map(customer => ({
        ...customer,
        customer_id: customer.id || customer.customer_id, // Use 'id' from backend if available, fallback to 'customer_id'
        createdAt: customer.createdAt || new Date().toISOString(), // Add a mock createdAt if not from backend
        areas: customer.areas
          ? customer.areas.map(area => ({
              ...area,
              areaName: area.areaName || area.area_name || "",
              branches: area.branches
                ? area.branches.map(branch => ({
                    ...branch,
                    branchName: branch.branchName || branch.branch_name || "",
                    branchPhone: branch.branchPhone || branch.branch_phoneno || "",
                  }))
                : [],
            }))
          : [], // Ensure areas is always an array
      }));
      setCustomers(processedData);
      setFilteredCustomers(processedData); // Initialize filtered list with actual data
    } catch (error) {
      console.error("Error fetching customers:", error);
      setErrorMessage("Failed to fetch customers: " + error.message);
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Handles changes in the main customer form fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      // Allow only digits and max length 10
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({
        ...prev,
        [name]: digitsOnly,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handles changes in branch name or phone
  const handleBranchChange = (areaIndex, branchIndex, field, value) => {
    const newAreas = [...areas];
    if (field === "branchPhone") {
      // Allow only digits and max length 10
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      newAreas[areaIndex].branches[branchIndex][field] = digitsOnly;
    } else {
      newAreas[areaIndex].branches[branchIndex][field] = value;
    }
    setAreas(newAreas);
  };

  // Handles changes in area name input
  const handleAreaChange = (index, value) => {
    const newAreas = [...areas];
    newAreas[index].areaName = value;
    setAreas(newAreas);
  };

  // Adds a new area block to the form
  const addArea = () => {
    setAreas([...areas, { areaName: "", branches: [{ branchName: "", branchPhone: "" }] }]);
  };

  // Adds a new branch to a specific area
  const addBranch = (areaIndex) => {
    const newAreas = [...areas];
    newAreas[areaIndex].branches.push({ branchName: "", branchPhone: "" });
    setAreas(newAreas);
  };

  // Deletes an area block
  const deleteArea = (areaIndex) => {
    const newAreas = [...areas];
    newAreas.splice(areaIndex, 1);
    setAreas(newAreas);
  };

  // Deletes a branch from a specific area
  const deleteBranch = (areaIndex, branchIndex) => {
    const newAreas = [...areas];
    newAreas[areaIndex].branches.splice(branchIndex, 1);
    setAreas(newAreas);
  };

  // Handles form submission (add or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    const payload = {
      customer_name: formData.customerName,
      address: formData.address,
      email: formData.email,
      phone: formData.phone,
      areas: areas.map(area => ({
        areaName: area.areaName,
        branches: area.branches.map(branch => ({
          branchName: branch.branchName,
          branchPhone: branch.branchPhone,
        })),
      })),
      createdAt: new Date().toISOString(), // Add creation timestamp for new customers
    };

    try {
      let response;
      if (editingCustomerId) {
        response = await fetch(`/api/customers/${editingCustomerId}`, { // Replace with your actual API endpoint
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch("/api/customers", { // Replace with your actual API endpoint
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save customer");
      }

      setSuccessMessage(editingCustomerId ? "Customer updated successfully!" : "Customer added successfully!");
      // Refresh customers list before page refresh
      await fetchCustomers();
      if (!editingCustomerId) {
        // For new customer, show success message and refresh after delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        // For update, refresh page to show updated details
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error("Submission error:", error);
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handles editing a customer
  const handleEdit = (customer) => {
    console.log("handleEdit called with customer:", customer);
    // Clear search term to show form
    setSearchTerm("");
    // Populate the main form fields
    setFormData({
      customerName: customer.customer_name || "",
      address: customer.address || "",
      email: customer.email || "",
      phone: customer.phone || "",
    });
    // Set the ID of the customer being edited
    setEditingCustomerId(customer.customer_id);

    // Populate the areas and branches form fields
    // Ensure that if a customer has no areas/branches, we start with a default empty one.
      if (customer.areas && customer.areas.length > 0) {
        const formattedAreas = customer.areas.map(area => ({
          areaName: area.areaName || "",
          branches: area.branches && area.branches.length > 0
            ? area.branches.map(branch => ({
                branchName: branch.branchName || "",
                branchPhone: branch.branchPhone || "",
              }))
            : [{ branchName: "", branchPhone: "" }], // Ensure at least one empty branch
        }));
        console.log("Formatted areas for editing:", formattedAreas);
        formattedAreas.forEach(area => {
          console.log("Branches for area:", area.areaName, area.branches);
        });
        setAreas(formattedAreas);
      } else {
        // If no areas, reset to default empty area/branch
        setAreas([{ areaName: "", branches: [{ branchName: "", branchPhone: "" }] }]);
      }

    // Clear any previous messages
    setSuccessMessage("");
    setErrorMessage("");
  };

  // Shows the delete confirmation modal
  const handleDeleteClick = (customer) => {
    setCustomerToDelete(customer);
    setShowDeleteConfirmModal(true);
  };

  // Confirms and performs the delete operation
  const confirmDelete = async () => {
    if (!customerToDelete) return;

    setShowDeleteConfirmModal(false); // Hide the modal
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/customers/${customerToDelete.customer_id}`, { // Replace with your actual API endpoint
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete customer");
      }
      setSuccessMessage("Customer deleted successfully!");
      setCustomerToDelete(null); // Clear customer to delete
      fetchCustomers(); // Re-fetch customers to update the list
    } catch (error) {
      console.error("Delete error:", error);
      setErrorMessage(error.message);
    } finally {

    }
  };

  // Cancels the delete operation and hides the modal
  const cancelDelete = () => {
    setShowDeleteConfirmModal(false);
    setCustomerToDelete(null);
  };

  // Tailwind CSS classes for dark/light mode inputs
  const inputBgColor = isDarkMode ? "bg-gray-800" : "bg-gray-200";
  const inputTextColor = isDarkMode ? "text-white" : "text-gray-800";
  const placeholderColor = isDarkMode ? "placeholder-gray-400" : "placeholder-gray-500";

  return (
    <div className={`p-6 space-y-8 min-h-screen ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}>
      {/* Notification Component */}
      {successMessage && <Notification message={successMessage} type="success" onClose={() => setSuccessMessage("")} />}
      {errorMessage && <Notification message={errorMessage} type="error" onClose={() => setErrorMessage("")} />}

      {/* Page Header */}
      <div className={`${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'} rounded-xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-center mb-6`}>
        <div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Add Customer</h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Create and manage your customers</p>
        </div>
        <div className="w-full md:w-80 mt-4 md:mt-0 relative">
          <input
            type="text"
            placeholder="Search customer, area, or branch..."
            className={`
                  w-full px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 shadow-md
                  ${isDarkMode
                    ? 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                    : 'bg-white border border-gray-300 text-gray-800 placeholder-gray-500 focus:border-blue-500'
                  }
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                `}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Customer Form Section */}
      {!searchTerm && (
        <div className={`${isDarkMode ? "bg-gray-900 border border-gray-800" : "bg-white border border-gray-200"} rounded-xl p-6 shadow-lg mb-6 flex-grow overflow-auto`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Details Inputs */}
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {editingCustomerId ? "Edit Customer" : "Add Customer"}
              </h3>
              
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="customerName" className={`block mb-1 font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Customer Name</label>
                <div className={`flex items-center space-x-2 ${inputBgColor} p-3 rounded-lg`}>
                  <User size={20} className={`${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
                  <input
                    type="text"
                    id="customerName"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="Enter customer name"
                    className={`bg-transparent border-none ${inputTextColor} ${placeholderColor} focus:outline-none w-full`}
                    required
                    ref={customerNameInputRef}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="address" className={`block mb-1 font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Address</label>
                <div className={`${inputBgColor} p-3 rounded-lg`}>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter address"
                    className={`w-full bg-transparent border-none ${inputTextColor} ${placeholderColor} focus:outline-none resize-y min-h-[40px]`}
                    rows="1"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="email" className={`block mb-1 font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Email</label>
                <div className={`flex items-center space-x-2 ${inputBgColor} p-3 rounded-lg`}>
                  <Mail size={20} className={`${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    className={`bg-transparent border-none ${inputTextColor} ${placeholderColor} focus:outline-none w-full`}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="phone" className={`block mb-1 font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Phone</label>
                <div className={`flex items-center space-x-2 ${inputBgColor} p-3 rounded-lg`}>
                  <Phone size={20} className={`${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    className={`bg-transparent border-none ${inputTextColor} ${placeholderColor} focus:outline-none w-full`}
                    ref={customerNameInputRef}
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Areas and Branches Section */}
            <div>
              <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Customer Areas & Branches</h3>
              {areas.map((area, areaIndex) => {
                // Get available districts for this specific area dropdown
                const availableDistrictsForThisArea = editingCustomerId 
                  ? allDistricts.filter(district => 
                      district === area.areaName || // Keep current selection
                      !areas.some((a, idx) => idx !== areaIndex && a.areaName === district) // Exclude other selected districts
                    )
                  : allDistricts.filter(district => 
                      district === area.areaName || // Keep current selection
                      !areas.some((a, idx) => idx !== areaIndex && a.areaName === district) // Exclude other selected districts
                    );

                return (
                  <div key={areaIndex} className={`mb-4 p-4 border rounded-lg ${isDarkMode ? "border-gray-600 bg-gray-800" : "border-gray-300 bg-gray-100"}`}>
                    <label className={`block mb-1 font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Area Name</label>
                    <select
                      value={area.areaName}
                      onChange={(e) => handleAreaChange(areaIndex, e.target.value)}
                      required
                      className={`w-full border rounded px-3 py-2 mb-3 ${isDarkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white text-gray-900"}`}
                    >
                      <option value="" disabled>Select District</option>
                      {availableDistrictsForThisArea.map(district => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>

                    <h4 className={`font-semibold mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Branches for {area.areaName || "this area"}</h4>
                    {area.branches.map((branch, branchIndex) => (
                      <div key={branchIndex} className={`mb-3 pl-4 border-l-2 ${isDarkMode ? "border-gray-700" : "border-gray-300"} relative`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={`block mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Branch Name</label>
                            <input
                              type="text"
                              value={branch.branchName}
                              required
                              onChange={(e) => handleBranchChange(areaIndex, branchIndex, "branchName", e.target.value)}
                              placeholder="e.g., Main Branch, City Center"
                              className={`w-full border rounded px-3 py-2 ${isDarkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white text-gray-900"}`}
                            />
                          </div>
                          <div>
                            <label className={`block mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Branch Phone</label>
                            <input
                              type="tel"
                              value={branch.branchPhone}
                              onChange={(e) => handleBranchChange(areaIndex, branchIndex, "branchPhone", e.target.value)}
                              placeholder="e.g., 0112345678"
                              className={`w-full border rounded px-3 py-2 ${isDarkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white text-gray-900"}`}
                            />
                          </div>
                        </div>
                        {/* Delete Branch Button */}
                        <button
                          type="button"
                          onClick={() => deleteBranch(areaIndex, branchIndex)}
                          className="mt-2 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
                        >
                          Delete Branch
                        </button>
                      </div>
                    ))}
                    {/* Add Branch Button */}
                    <button
                      type="button"
                      onClick={() => addBranch(areaIndex)}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm mr-2"
                    >
                      Add Branch
                    </button>
                    {/* Delete Area Button */}
                    <button
                      type="button"
                      onClick={() => deleteArea(areaIndex)}
                      className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
                    >
                      Delete Area
                    </button>
                  </div>
                );
              })}
              
              {/* Add New Area Button - Only show if there are available districts */}
              {getAvailableDistricts().length > 0 && (
                <button
                  type="button"
                  onClick={addArea}
                  className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
                >
                  Add New Area ({getAvailableDistricts().length} districts available)
                </button>
              )}
              
              {/* Message when no more districts are available */}
              {getAvailableDistricts().length === 0 && (
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"} italic`}>
                  All districts have been assigned to this customer.
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 space-x-3">
              {editingCustomerId && (
                <button
                  type="button"
                  onClick={() => {
                    // Reset form and exit edit mode
                    setFormData({
                      customerName: "",
                      address: "",
                      email: "",
                      phone: "",
                    });
                    setAreas([
                      {
                        areaName: "",
                        branches: [
                          {
                            branchName: "",
                            branchPhone: "",
                          },
                        ],
                      },
                    ]);
                    setEditingCustomerId(null);
                    setSuccessMessage("");
                    setErrorMessage("");
                  }}
                  className="px-6 py-3 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors font-medium"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className={`px-8 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-medium transition-colors transform hover:scale-105 ${isSubmitting ? 'opacity-75 cursor-wait' : ''}`}
                disabled={isSubmitting} // Disable button while submitting
              >
                {isSubmitting ? (editingCustomerId ? 'Updating...' : 'Adding Customer...') : (editingCustomerId ? 'Update Customer' : 'Add Customer')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customer List Display Section - Now using CustomerCard */}
      <div className={`p-6 ${isDarkMode ? "bg-gray-900 text-gray-200" : "bg-gray-50 text-gray-900"}`}>
      <h2 className="text-2xl font-bold mb-4">Add / Manage Customers</h2>

      {/* Customer Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadingCustomers ? <LoadingItems /> : filteredCustomers.map(customer => (
          <CustomerCard
            key={customer.customer_id}
            customer={customer}
            isDarkMode={isDarkMode}
            handleEdit={handleEdit}
            handleDeleteClick={handleDeleteClick}
          />
        ))}
      </div>

      {/* Notification & Confirmation Modals */}
      {successMessage && <Notification message={successMessage} type="success" onClose={() => setSuccessMessage("")} />}
      {errorMessage && <Notification message={errorMessage} type="error" onClose={() => setErrorMessage("")} />}
      {showDeleteConfirmModal && <ConfirmationModal message="Are you sure you want to delete this customer?" onConfirm={confirmDelete} onCancel={() => setShowDeleteConfirmModal(false)} />}
    </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        show={showDeleteConfirmModal}
        title="Confirm Deletion"
        message={`Are you sure you want to delete customer "${customerToDelete?.customer_name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default AddCustomer;