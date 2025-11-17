import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { ThemeContext } from "../../components/ThemeContext/ThemeContext";
import { FaTrash } from "react-icons/fa";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";
import LoadingItems from "../../components/Loading/LoadingItems";
import Notification from "../../components/Notification/Notification";

const PaymentPage = ({ jobHomeId, jobCardId, onLoaded }) => {
  const [fullPayment, setFullPayment] = useState("");
  const [advancePayment, setAdvancePayment] = useState("");
  const [restPayment, setRestPayment] = useState(0);
  const [payments, setPayments] = useState([]);
  const [paymentObjects, setPaymentObjects] = useState([]);
  const [currentPayment, setCurrentPayment] = useState("");
  const [isLoadingQuotation, setIsLoadingQuotation] = useState(false);
  const [quotationError, setQuotationError] = useState(null);
  const [isAdvancePaid, setIsAdvancePaid] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmPaymentData, setConfirmPaymentData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [isSubmittingAdvance, setIsSubmittingAdvance] = useState(false);

  const { isDarkMode } = useContext(ThemeContext);

  // Notification state (following ImageUpload pattern)
  const [notification, setNotificationState] = useState({ message: '', type: 'success' });

  // Notification helper functions (following ImageUpload pattern)
  const showNotification = (message, type) => {
    setNotificationState({ message, type });
  };

  const clearNotification = () => {
    setNotificationState({ message: '', type: 'success' });
  };

  // Fetch quotation data when jobCardId changes
  useEffect(() => {
    if (!jobCardId) return;

    const fetchQuotation = async () => {
      setIsLoadingQuotation(true);
      setQuotationError(null);
      try {
        const response = await axios.get(`http://localhost:8000/api/quotations/${jobCardId}`, { withCredentials: true });
        const quotation = response.data;
        if (quotation && quotation.total_with_tax_vs_disc) {
          setFullPayment(parseFloat(quotation.total_with_tax_vs_disc).toFixed(2));
          showNotification("Quotation loaded successfully!", "success");
        } else {
          setQuotationError("Quotation not found or total not available.");
          showNotification("Quotation not found or total not available.", "error");
        }
      } catch (error) {
        console.error("Failed to fetch quotation", error);
        setQuotationError("Failed to load quotation data.");
        showNotification("Failed to load quotation data. Please try again.", "error");
      } finally {
        setIsLoadingQuotation(false);
      }
    };

    fetchQuotation();
  }, [jobCardId]);

  // Fetch existing payments when jobHomeId changes
  useEffect(() => {
    if (!jobHomeId) return;

    const fetchPayments = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/payments/by-jobhome/${jobHomeId}`, { withCredentials: true });
        const existingPayments = response.data;
        setPaymentObjects(existingPayments);
        // Calculate total paid from existing payments
        const totalPaid = existingPayments.reduce((sum, payment) => sum + parseFloat(payment.payment_amount), 0);
        const paymentAmounts = existingPayments.map(p => parseFloat(p.payment_amount));
        setPayments(paymentAmounts);
        // If there are existing payments, set advance as the first payment and mark as paid
        if (paymentAmounts.length > 0) {
          setAdvancePayment(paymentAmounts[0].toFixed(2));
          setIsAdvancePaid(true);
        }
        // Update rest payment based on existing payments
        const rest = parseFloat(fullPayment || 0) - totalPaid;
        setRestPayment(rest > 0 ? rest : 0);
        
        if (existingPayments.length > 0) {
          showNotification("Payment history loaded successfully!", "success");
        }
      } catch (error) {
        console.error("Failed to fetch payments", error);
        showNotification("Failed to load payment history. Please try again.", "error");
      }
    };

    fetchPayments();
  }, [jobHomeId, fullPayment]);

  // Call onLoaded when data is loaded
  useEffect(() => {
    if (onLoaded && !isLoadingQuotation && fullPayment !== "" && payments.length >= 0) {
      onLoaded();
    }
  }, [onLoaded, isLoadingQuotation, fullPayment, payments]);

  const handleInitialSubmit = async () => {
    const advance = parseFloat(advancePayment || 0);
    const full = parseFloat(fullPayment || 0);
    const rest = full - advance;
    setRestPayment(rest);

    if (advance > 0 && jobHomeId) {
      setIsSubmittingAdvance(true);
      try {
        await axios.post(`http://localhost:8000/api/payments`, {
          jobhomeid: jobHomeId,
          payment_amount: advance,
          date: new Date().toISOString().split('T')[0], // Today's date
        }, { withCredentials: true });

        // Add the saved advance payment to the payments array
        setPayments(prev => [...prev, advance]);
        setIsAdvancePaid(true);
        showNotification("Advance payment saved successfully!", "success");
      } catch (error) {
        console.error("Failed to save advance payment", error);
        showNotification("Failed to save advance payment. Please try again.", "error");
      } finally {
        setIsSubmittingAdvance(false);
      }
    } else if (advance <= 0) {
      showNotification("Please enter a valid advance payment amount.", "error");
    }
  };

  const handlePaymentSubmit = async () => {
    const value = parseFloat(currentPayment);
    if (isNaN(value) || value <= 0) {
      showNotification("Please enter a valid payment amount.", "error");
      return;
    }
    if (!jobHomeId) {
      showNotification("Job Home ID is missing. Please refresh the page.", "error");
      return;
    }

    setIsSubmittingPayment(true);
    try {
      await axios.post(`http://localhost:8000/api/payments`, {
        jobhomeid: jobHomeId,
        payment_amount: value,
        date: new Date().toISOString().split('T')[0], // Today's date
      }, { withCredentials: true });

      // Add the new payment to the list
      setPayments([...payments, value]);
      const newRest = restPayment - value;
      setRestPayment(newRest > 0 ? newRest : 0);
      setCurrentPayment("");
      showNotification("Payment submitted successfully!", "success");
      
      // Check if all payments are completed
      if (newRest <= 0) {
        showNotification("All payments completed! Redirecting to job home page...", "success");
        setTimeout(() => {
          navigate(`/dashboard/job-home/${jobHomeId}`);
        }, 3000); // Wait 3 seconds to show the completion message
      } else {
        // Redirect after partial payment as well
        setTimeout(() => {
          navigate(`/dashboard/job-home/${jobHomeId}`);
        }, 2000); // Wait 2 seconds to show the success message
      }
    } catch (error) {
      console.error("Failed to submit payment", error);
      showNotification("Failed to submit payment. Please try again.", "error");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!confirmPaymentData) return;

    const { paymentId, paymentAmount, index } = confirmPaymentData;
    setIsDeleting(true);
    setShowConfirmModal(false);

    try {
      await axios.delete(`http://localhost:8000/api/payments/${paymentId}`, { withCredentials: true });

      // Remove the payment from both arrays
      setPayments(prev => prev.filter((_, i) => i !== index));
      setPaymentObjects(prev => prev.filter(p => p.id !== paymentId));

      // Update rest payment
      const newRest = restPayment + parseFloat(paymentAmount);
      setRestPayment(newRest);

      // If this was the first payment (advance), reset advance payment state
      if (index === 0) {
        setIsAdvancePaid(false);
        setAdvancePayment("");
      }
      
      showNotification("Payment deleted successfully!", "success");
    } catch (error) {
      console.error("Failed to delete payment", error);
      showNotification("Failed to delete payment. Please try again.", "error");
    } finally {
      setIsDeleting(false);
      setConfirmPaymentData(null);
    }
  };

  const handleConfirmDelete = (paymentId, paymentAmount, index) => {
    setConfirmPaymentData({ paymentId, paymentAmount, index });
    setShowConfirmModal(true);
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    setConfirmPaymentData(null);
  };

  // Loading state for the entire component
  if (isLoadingQuotation && !fullPayment) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}>
        <LoadingItems isDarkMode={isDarkMode} />
      </div>
    );
  }

  return (
    <>
      {/* Notification component at the top (following ImageUpload pattern) */}
      <Notification 
        message={notification.message} 
        type={notification.type} 
        onClose={clearNotification} 
      />
      
      {/* Confirmation Modal (following ImageUpload pattern) */}
      <ConfirmationModal
        show={showConfirmModal}
        isDarkMode={isDarkMode}
        title="Confirm Deletion"
        message={`Are you sure you want to delete this payment of Rs. ${confirmPaymentData?.paymentAmount}? This action cannot be undone.`}
        onConfirm={handleDeletePayment}
        onCancel={handleCancelDelete}
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        cancelLabel="Cancel"
      />

      <div
        className={`flex items-center justify-center ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}
      >
        <div
          className={`p-8 rounded-xl shadow-lg w-full max-w-lg ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
        >
          <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">
            Payment Form
          </h1>

          <div className="mb-4">
            <label className="block font-semibold mb-1">Total (With TAX & Discount):</label>
            {isLoadingQuotation ? (
              <div className="w-full p-3 border rounded bg-gray-100 text-gray-500 flex items-center justify-center">
                <LoadingItems isDarkMode={isDarkMode} />
                <span className="ml-2">Loading quotation...</span>
              </div>
            ) : quotationError ? (
              <div className="w-full p-3 border rounded bg-red-100 text-red-600">{quotationError}</div>
            ) : (
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full p-3 border rounded"
                value={fullPayment}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (value >= 0 || e.target.value === "") {
                    setFullPayment(e.target.value);
                  }
                }}
                placeholder="Enter full payment amount"
              />
            )}
          </div>

          <div className="mb-4">
            <label className="block font-semibold mb-1">Advanced Payment</label>
            {isAdvancePaid ? (
              <input
                type="number"
                className="w-full p-3 border rounded bg-gray-200 cursor-not-allowed"
                value={advancePayment}
                readOnly
              />
            ) : (
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full p-3 border rounded"
                value={advancePayment}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (value >= 0 || e.target.value === "") {
                    setAdvancePayment(e.target.value);
                  }
                }}
                placeholder="Enter advanced payment amount"
              />
            )}
          </div>

          {!isAdvancePaid && (
            <button
              className={`w-full py-3 rounded transition ${
                isSubmittingAdvance 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
              onClick={handleInitialSubmit}
              disabled={isSubmittingAdvance}
            >
              {isSubmittingAdvance ? "Processing..." : "Confirm & Calculate Rest"}
            </button>
          )}

          {fullPayment && (
            <div
              className={`mt-6 p-4 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
            >
              <p className="font-semibold mb-2">
                Rest of the Payment:{" "}
                <span className="text-red-600">Rs. {parseFloat(restPayment).toFixed(2)}</span>
              </p>

              {payments.map((amt, index) => (
                <div key={index} className="mb-2 text-sm flex items-center justify-between">
                  <span>Payment {index + 1}: Rs. {parseFloat(amt).toFixed(2)}</span>
                  {index > 0 && (
                    <FaTrash
                      className={`cursor-pointer transition-colors ${
                        isDeleting 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-red-500 hover:text-red-700'
                      }`}
                      onClick={() => !isDeleting && handleConfirmDelete(paymentObjects[index].id, amt, index)}
                    />
                  )}
                </div>
              ))}

              {restPayment > 0 && (
                <div className="mt-4">
                  <label className="block font-semibold mb-1">
                    Payment {payments.length + 1}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={currentPayment}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (value >= 0 || e.target.value === "") {
                        setCurrentPayment(e.target.value);
                      }
                    }}
                    className="w-full p-3 border rounded mb-2"
                    placeholder="Enter payment amount"
                    disabled={isSubmittingPayment}
                  />
                  <button
                    type="button"
                    onClick={handlePaymentSubmit}
                    disabled={isSubmittingPayment}
                    className={`w-full py-3 rounded transition ${
                      isSubmittingPayment 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                  >
                    {isSubmittingPayment ? "Processing..." : "Submit Payment"}
                  </button>
                </div>
              )}

              {restPayment <= 0 && (
                <p className="text-green-600 font-bold mt-4">
                  ✅ All payments completed.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PaymentPage;