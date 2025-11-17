// src/contexts/CompanySettingsContext.js
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api'; // IMPORTANT: Adjust this to your actual Laravel backend URL

export const CompanySettingsContext = createContext();

export const CompanySettingsProvider = ({ children }) => {
    const [companyName, setCompanyName] = useState('Default Company');
    const [companyLogoUrl, setCompanyLogoUrl] = useState(null); // This will hold the URL for the logo route
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);

    const fetchCompanySettings = async () => {
        setIsLoadingSettings(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/company-settings`);
            // Response data will already contain the generated logo_url from Laravel
            setCompanyName(response.data.company_name || 'Default Company');
            setCompanyLogoUrl(response.data.logo_url);
        } catch (error) {
            console.error("Error fetching company settings for context:", error);
            setCompanyName('Default Company'); // Fallback
            setCompanyLogoUrl(null); // Fallback
        } finally {
            setIsLoadingSettings(false);
        }
    };

    useEffect(() => {
        fetchCompanySettings();
    }, []);

    const updateCompanySettings = async (name, logoFile, removeLogo) => {
        const formData = new FormData();
        formData.append('company_name', name);
        if (logoFile) {
            formData.append('logo', logoFile); // Append the actual File object
        } else if (removeLogo) {
            formData.append('remove_logo', true); // Signal to remove
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/company-settings`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setCompanyName(response.data.settings.company_name || 'Default Company');
            setCompanyLogoUrl(response.data.settings.logo_url); // Update with the new logo URL from response
            return { success: true, message: response.data.message };
        } catch (error) {
            console.error('Error updating company settings:', error);
            return {
                success: false,
                message: error.response?.data?.message || "Failed to update settings.",
            };
        }
    };

    return (
        <CompanySettingsContext.Provider value={{
            companyName,
            companyLogoUrl,
            isLoadingSettings,
            fetchCompanySettings,
            updateCompanySettings,
            // You might want to expose a setter for logo URL if needed, but updateCompanySettings should handle it
            setCompanyLogoUrl // Exposing this just in case, but ideally updateCompanySettings controls it
        }}>
            {children}
        </CompanySettingsContext.Provider>
    );
};