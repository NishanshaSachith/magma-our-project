import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { ThemeContext } from "../../components/ThemeContext/ThemeContext";
import Notification from "../../components/Notification/Notification";
import LoadingItems from "../../components/Loading/LoadingItems";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";

const CancelJobPage = ({ jobHomeId }) => {
  const { isDarkMode } = useContext(ThemeContext);

  const [jobHome, setJobHome] = useState(null);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [notification, setNotification] = useState({ message: '', type: 'success' });
  const [submittedCancellation, setSubmittedCancellation] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const API_BASE_URL = 'http://127.0.0.1:8000/api';
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return { Authorization: `Bearer ${token}` };
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  const clearNotification = () => {
    setNotification({ message: '', type: 'success' });
  };

  const handleCancelJobClick = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      showNotification("Reason is required.", "error");
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmCancel = async () => {
    setShowConfirmModal(false);
    await handleSubmit({ preventDefault: () => {} });
  };

  const handleCancelModal = () => {
    setShowConfirmModal(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const jobResponse = await axios.get(`${API_BASE_URL}/job-homes/${parseInt(jobHomeId)}`, { headers: getAuthHeaders() });
        setJobHome(jobResponse.data);

        // Fetch existing cancellation
        try {
          const cancelResponse = await axios.get(`${API_BASE_URL}/job-cancellations/${parseInt(jobHomeId)}`, { headers: getAuthHeaders() });
          setSubmittedCancellation(cancelResponse.data);
          setReason(cancelResponse.data.reason || "");
          setDescription(cancelResponse.data.description || "");
        } catch (cancelErr) {
          // No cancellation exists, that's fine
          setReason("");
          setDescription("");
        }
      } catch (err) {
        console.error("Failed to fetch job home:", err);
        showNotification("Failed to load job details.", "error");
      } finally {
        setFetchLoading(false);
      }
    };
    if (jobHomeId) {
      fetchData();
    }
  }, [jobHomeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jobHomeId || isNaN(parseInt(jobHomeId))) {
      showNotification("Invalid job id.", "error");
      return;
    }
    if (!reason.trim()) {
      showNotification("Reason is required.", "error");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/job-cancellations`, {
        job_home_id: parseInt(jobHomeId),
        reason,
        description,
      }, { headers: getAuthHeaders() });
      showNotification("Job cancelled successfully!", "success");
      setSubmittedCancellation(response.data);
      setReason(response.data.reason || "");
      setDescription(response.data.description || "");
    } catch (err) {
      console.error("Cancellation failed:", err);
      showNotification(err.response?.data?.message || "Failed to cancel job. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Notification message={notification.message} type={notification.type} onClose={clearNotification} />
      <div className={`min-h-screen p-6 transition-colors ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Cancel Job</h1>
          {fetchLoading ? (
            <LoadingItems isDarkMode={isDarkMode} />
          ) : (
            <>
              
              <form onSubmit={handleSubmit} className={`p-6 rounded-lg shadow-lg ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
              {submittedCancellation && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900 rounded-lg">
                  <h2 className="text-lg font-semibold mb-2">Cancellation Details</h2>
                  <p><strong>Reason:</strong> {submittedCancellation.reason}</p>
                  <p><strong>Description:</strong> {submittedCancellation.description}</p>
                  <p><strong>Cancel Date & Time:</strong> {new Date(submittedCancellation.created_at).toLocaleString()}</p>
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Reason</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={`w-full p-3 border rounded-lg ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                  placeholder="Enter reason for cancellation"
                  required
                  disabled={!!submittedCancellation}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full p-3 border rounded-lg resize-none ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                  rows={4}
                  placeholder="Provide additional details"
                  disabled={!!submittedCancellation}
                />
              </div>
              <button
                type="button"
                onClick={handleCancelJobClick}
                disabled={loading || !!submittedCancellation}
                className={`w-full px-6 py-3 rounded-lg shadow transition ${loading || !!submittedCancellation ? "bg-red-600 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"} text-white`}
              >
                {loading ? "Cancelling..." : submittedCancellation ? "Job Cancelled" : "Cancel Job"}
              </button>
            </form>
            </>
          )}
        </div>
      </div>
      <ConfirmationModal
        show={showConfirmModal}
        title="Confirm Job Cancellation"
        message="Are you sure you want to cancel this job? This action cannot be undone."
        onConfirm={handleConfirmCancel}
        onCancel={handleCancelModal}
        confirmLabel="Yes, Cancel Job"
        cancelLabel="No, Keep Job"
        isDarkMode={isDarkMode}
      />
    </>
  );
};

export default CancelJobPage;
