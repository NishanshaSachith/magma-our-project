import React, { useContext, useState, useEffect, useRef } from 'react';
import { ThemeContext } from '../../components/ThemeContext/ThemeContext';
import { FiUser } from "react-icons/fi";
import api from '../../services/api';
import { CompanySettingsContext } from '../../context/CompanySettingsContext';
import Notification from '../../components/Notification/Notification'; 
import { useAuth } from '../hooks/useAuth';



const Settings = () => {
    const { isDarkMode } = useContext(ThemeContext);
    const { setCompanyLogoUrl } = useContext(CompanySettingsContext); 
    const [companyName, setCompanyName] = useState('');
    const [accountName, setAccountName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [bankName, setBankName] = useState('');
    const [bankBranch, setBankBranch] = useState('');
    const [headOfTechnicalName, setHeadOfTechnicalName] = useState('');
    const [headOfTechnicalContact, setHeadOfTechnicalContact] = useState('');
    const [profileImage, setProfileImage] = useState(null); 
    const [selectedFile, setSelectedFile] = useState(null); 
    const [isImageRemoved, setIsImageRemoved] = useState(false); 
    const fileInputRef = useRef(null); 
    const [isSaving, setIsSaving] = useState(false); 
    const [saveSuccessMessage, setSaveSuccessMessage] = useState(""); 
    const [errorMessage, setErrorMessage] = useState(""); 
    const { userRole, isLoading } = useAuth();

    const isAdmin = userRole === 'Administrator' || userRole === 'administrator' || userRole === 'admin';
    
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/company-settings');
                const { company_name, logo_url, account_name, account_number, bank_name, bank_branch, head_of_technical_name, head_of_technical_contact } = response.data;
                setCompanyName(company_name || '');
                setProfileImage(logo_url);
                setCompanyLogoUrl(logo_url);
                setAccountName(account_name || '');
                setAccountNumber(account_number || '');
                setBankName(bank_name || '');
                setBankBranch(bank_branch || '');
                setHeadOfTechnicalName(head_of_technical_name || '');
                setHeadOfTechnicalContact(head_of_technical_contact || '');
            } catch (error) {
                console.error("Error fetching company settings:", error);
                setErrorMessage("Failed to load company settings.");
            }
        };
        fetchSettings();
    }, [setCompanyLogoUrl]);

    const handleCompanyNameChange = (event) => { if (isAdmin) setCompanyName(event.target.value); };
    const handleAccountNameChange = (event) => { if (isAdmin) setAccountName(event.target.value); };
    const handleAccountNumberChange = (event) => { if (isAdmin) setAccountNumber(event.target.value); };
    const handleBankNameChange = (event) => { if (isAdmin) setBankName(event.target.value); };
    const handleBankBranchChange = (event) => { if (isAdmin) setBankBranch(event.target.value); };
    const handleHeadOfTechnicalNameChange = (event) => { if (isAdmin) setHeadOfTechnicalName(event.target.value); };
    const handleHeadOfTechnicalContactChange = (event) => { if (isAdmin) setHeadOfTechnicalContact(event.target.value); };

    const handleSaveProfile = async () => {
        if (!isAdmin) {
            setErrorMessage("You don't have permission to save changes.");
            return;
        }

        setIsSaving(true);
        setSaveSuccessMessage(""); 
        setErrorMessage("");

        const formData = new FormData();
        formData.append('company_name', companyName);
        formData.append('account_name', accountName);
        formData.append('account_number', accountNumber);
        formData.append('bank_name', bankName);
        formData.append('bank_branch', bankBranch);
        formData.append('head_of_technical_name', headOfTechnicalName);
        formData.append('head_of_technical_contact', headOfTechnicalContact);

        if (selectedFile) {
            formData.append('logo', selectedFile); 
            formData.append('remove_logo', 0); 
        } else if (isImageRemoved) {
            formData.append('remove_logo', 1); 
        } else {
            formData.append('remove_logo', 0);
        }

        try {
            const response = await api.put('/company-settings', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setSaveSuccessMessage(response.data.message);
            setCompanyName(response.data.settings.company_name);
            setProfileImage(response.data.settings.logo_url);
            setCompanyLogoUrl(response.data.settings.logo_url);
            setAccountName(response.data.settings.account_name);
            setBankName(response.data.settings.bank_name);
            setBankBranch(response.data.settings.bank_branch);
            setHeadOfTechnicalName(response.data.settings.head_of_technical_name);
            setHeadOfTechnicalContact(response.data.settings.head_of_technical_contact);

            setSelectedFile(null);
            setIsImageRemoved(false);

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
                    setErrorMessage("An unexpected error occurred while saving (check console).");
                }
            } else {
                setErrorMessage("Network error or no response from server. Check your backend server is running.");
            }
        } finally {
            setIsSaving(false); 
        }
    };

    const handleImageChange = (event) => {
        if (!isAdmin) return;
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file); 
            const reader = new FileReader(); 
            reader.onloadend = () => {
                setProfileImage(reader.result); 
                setIsImageRemoved(false); 
            };
            reader.readAsDataURL(file); 
        }
    };

    const handleUploadButtonClick = () => { if (isAdmin) fileInputRef.current.click(); };
    const handleRemoveImage = () => { if (isAdmin) { setProfileImage(null); setSelectedFile(null); setIsImageRemoved(true); } };

    if (isLoading) {
        return (
            <div className={`min-h-screen p-6 flex items-center justify-center transition-all ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-lg font-semibold">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen p-4 md:p-8 transition-all ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
            
            {/* Header */}
            <div className={`${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center`}>
                <div>  
                    <div>
                        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Company Settings</h1>
                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1 text-sm md:text-base`}>
                            {isAdmin ? 'Manage your company details and preferences' : 'Viewing company details (read-only)'}
                        </p>
                    </div>
                </div>
                {!isAdmin && (
                    <div className={`px-4 py-2 rounded-full text-sm font-medium mt-3 md:mt-0 ${isDarkMode ? 'bg-yellow-900 text-yellow-200 border border-yellow-600' : 'bg-yellow-100 text-yellow-800 border border-yellow-300'}`}>
                        View Only Mode
                    </div>
                )}
            </div>

            {/* Notifications */}
            {saveSuccessMessage && <Notification message={saveSuccessMessage} type="success" onClose={() => setSaveSuccessMessage("")} />}
            {errorMessage && <Notification message={errorMessage} type="error" onClose={() => setErrorMessage("")} />}

            {/* Main Content */}
            <div className={`${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} rounded-2xl p-6 shadow-xl mt-8`}>
                <div className="flex flex-col lg:flex-row gap-8">
                    
                    {/* Left - Logo & Company Name */}
                    <div className="flex flex-col items-center lg:w-1/3 space-y-6">
                        
                        {/* Logo */}
                        <div className={`p-6 rounded-2xl w-full flex flex-col items-center shadow-lg ${isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                            <div className="w-32 h-32">
                                {profileImage ? (
                                    <img 
                                        src={profileImage instanceof File ? URL.createObjectURL(profileImage) : profileImage}
                                        alt="Company Icon"
                                        className="w-full h-full rounded-full object-cover border border-gray-500 shadow-md"
                                    />
                                ) : (
                                    <FiUser className="w-full h-full text-gray-400 rounded-full border border-dashed border-gray-400 p-6" />
                                )}
                            </div>
                            {isAdmin && (
                                <div className="mt-4 flex flex-wrap gap-3 justify-center">
                                    <button 
                                        onClick={handleUploadButtonClick} 
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md transition-all"
                                    >
                                        Change Icon
                                    </button>
                                    {profileImage && (
                                        <button 
                                            onClick={handleRemoveImage} 
                                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium shadow-md transition-all"
                                        >
                                            Remove
                                        </button>
                                    )}
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" ref={fileInputRef} />
                                </div>
                            )}
                            <p className="text-xs text-gray-400 mt-2">PNG or JPG • Max 2MB</p>
                        </div>

                        {/* Company Name */}
                        <div className={`p-6 rounded-2xl w-full shadow-lg ${isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                            <label htmlFor="companyName" className="block text-sm font-semibold mb-2">Company Name</label>
                            <input
                                type="text"
                                id="companyName"
                                className={`w-full py-2.5 px-3 rounded-lg border focus:ring-2 focus:outline-none transition-all ${
                                    isDarkMode ? 'bg-gray-800 text-white border-gray-600 focus:ring-blue-500' : 'bg-white text-gray-800 border-gray-300 focus:ring-blue-400'
                                } ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                                placeholder={isAdmin ? "Enter Company Name" : "Company Name (Read Only)"}
                                value={companyName}
                                onChange={handleCompanyNameChange}
                                readOnly={!isAdmin}
                                disabled={!isAdmin}
                            />
                        </div>
                    </div>

                    {/* Right - Details */}
                    <div className="flex-1 space-y-6">
                        
                        {/* Bank Details */}
                        <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                            <h2 className="text-lg font-bold mb-4">Bank Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="accountName" className="block text-sm font-semibold mb-2">Account Name</label>
                                    <input type="text" id="accountName"
                                        className={`w-full py-2.5 px-3 rounded-lg border focus:ring-2 transition-all ${
                                            isDarkMode ? 'bg-gray-800 text-white border-gray-600 focus:ring-blue-500' : 'bg-white text-gray-800 border-gray-300 focus:ring-blue-400'
                                        } ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        placeholder={isAdmin ? "Enter Account Name" : "Read Only"}
                                        value={accountName} onChange={handleAccountNameChange}
                                        readOnly={!isAdmin} disabled={!isAdmin} />
                                </div>
                                <div>
                                    <label htmlFor="accountNumber" className="block text-sm font-semibold mb-2">Account Number</label>
                                    <input type="text" id="accountNumber"
                                        className={`w-full py-2.5 px-3 rounded-lg border focus:ring-2 transition-all ${
                                            isDarkMode ? 'bg-gray-800 text-white border-gray-600 focus:ring-blue-500' : 'bg-white text-gray-800 border-gray-300 focus:ring-blue-400'
                                        } ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        placeholder={isAdmin ? "Enter Account Number" : "Read Only"}
                                        value={accountNumber} onChange={handleAccountNumberChange}
                                        readOnly={!isAdmin} disabled={!isAdmin} />
                                </div>
                                <div>
                                    <label htmlFor="bankName" className="block text-sm font-semibold mb-2">Bank Name</label>
                                    <input type="text" id="bankName"
                                        className={`w-full py-2.5 px-3 rounded-lg border focus:ring-2 transition-all ${
                                            isDarkMode ? 'bg-gray-800 text-white border-gray-600 focus:ring-blue-500' : 'bg-white text-gray-800 border-gray-300 focus:ring-blue-400'
                                        } ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        placeholder={isAdmin ? "Enter Bank Name" : "Read Only"}
                                        value={bankName} onChange={handleBankNameChange}
                                        readOnly={!isAdmin} disabled={!isAdmin} />
                                </div>
                                <div>
                                    <label htmlFor="bankBranch" className="block text-sm font-semibold mb-2">Bank Branch</label>
                                    <input type="text" id="bankBranch"
                                        className={`w-full py-2.5 px-3 rounded-lg border focus:ring-2 transition-all ${
                                            isDarkMode ? 'bg-gray-800 text-white border-gray-600 focus:ring-blue-500' : 'bg-white text-gray-800 border-gray-300 focus:ring-blue-400'
                                        } ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        placeholder={isAdmin ? "Enter Bank Branch" : "Read Only"}
                                        value={bankBranch} onChange={handleBankBranchChange}
                                        readOnly={!isAdmin} disabled={!isAdmin} />
                                </div>
                            </div>
                        </div>

                        {/* Head of Technical */}
                        <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                            <h2 className="text-lg font-bold mb-4">Head of Technical</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="headOfTechnicalName" className="block text-sm font-semibold mb-2">Name</label>
                                    <input type="text" id="headOfTechnicalName"
                                        className={`w-full py-2.5 px-3 rounded-lg border focus:ring-2 transition-all ${
                                            isDarkMode ? 'bg-gray-800 text-white border-gray-600 focus:ring-blue-500' : 'bg-white text-gray-800 border-gray-300 focus:ring-blue-400'
                                        } ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        placeholder={isAdmin ? "Enter Name" : "Read Only"}
                                        value={headOfTechnicalName} onChange={handleHeadOfTechnicalNameChange}
                                        readOnly={!isAdmin} disabled={!isAdmin} />
                                </div>
                                <div>
                                    <label htmlFor="headOfTechnicalContact" className="block text-sm font-semibold mb-2">Contact</label>
                                    <input type="text" id="headOfTechnicalContact"
                                        className={`w-full py-2.5 px-3 rounded-lg border focus:ring-2 transition-all ${
                                            isDarkMode ? 'bg-gray-800 text-white border-gray-600 focus:ring-blue-500' : 'bg-white text-gray-800 border-gray-300 focus:ring-blue-400'
                                        } ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        placeholder={isAdmin ? "Enter Contact" : "Read Only"}
                                        value={headOfTechnicalContact} onChange={handleHeadOfTechnicalContactChange}
                                        readOnly={!isAdmin} disabled={!isAdmin} />
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        {isAdmin && (
                            <div className="flex justify-end">
                                <button
                                    onClick={handleSaveProfile}
                                    className={`px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold shadow-md transition-all ${isSaving ? 'opacity-75 cursor-wait' : ''}`}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Saving Changes...' : 'Save Changes'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
