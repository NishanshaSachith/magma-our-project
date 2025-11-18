import React, { useState, useEffect, useContext, useCallback, useRef, useMemo } from "react";
import {
  FaTimes, FaImage, FaEnvelope, FaArrowLeft,
  FaMoneyBillWave, FaSpinner, FaExclamationTriangle,
  FaTools, FaFileInvoiceDollar, FaQuoteRight,
} from "react-icons/fa";
import { Link, useParams, useNavigate } from "react-router-dom";
// Assuming these components are already responsive or will be made responsive
import JobCard from "../../components/DocumentsLevel/JobCard/JobCard";
import Invoice from "../../components/DocumentsLevel/Invoice/Invoice";
import Quotation from "../../components/DocumentsLevel/Qutation/Quatation";
import ProgressBar from "../../components/ProgressBar/ProgressBar";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";
import { ThemeContext } from "../../components/ThemeContext/ThemeContext";
import { UserPlus, CircleX } from "lucide-react";
import { useAuth } from "../../pages/hooks/useAuth";
import LoadingItems from "../../components/Loading/LoadingItems";
import api from '../../services/api';

import CancelJobPage from "./CancelJobPage";
import ImageUpload from "./ImageUpload";
import PaymentPage from "./Payment";
import JobFlowStepper from "../../components/JobFlowStepper/JobFlowStepper";
import AssignTechnicians from "./AssignTechnicians";
import Message from "./Message";



const JobHome = ({ onGoBack, job }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [jobData, setJobData] = useState(null);
  const [selectedComponent, setSelectedComponent] = useState("JobCard");
  const [jobCardId, setJobCardId] = useState(null);
  const [quotationId, setQuotationId] = useState(null);
  useEffect(() => {
    console.log("JobHome's quotationId state is:", quotationId);
  }, [quotationId]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isDarkMode } = useContext(ThemeContext);
  const jobType = job?.service || jobData?.job_home?.job_type || "Repair";

  const formatDateTime = (value) => {
    if (!value) return 'N/A';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'N/A';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${hh}:${mm}`;
  };

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      navigate('/dashboard');
    }
  };

  const [showCancelJob, setShowCancelJob] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showAssignTechnicians, setShowAssignTechnicians] = useState(false);
  // Destructure all relevant states from the useAuth hook, including isLoading and isAuthenticated
  const { isAuthenticated, userRole } = useAuth();

  const refetchJobData = async () => {
    if (!job?.job_home_id && !id) return;
    try {
      const jobHomeId = job?.job_home_id || id;
      const res = await api.get(`/job-homes/${jobHomeId}`);
      setJobData(res.data);
      if (res.data.job_card?.id) {
        setJobCardId(res.data.job_card.id);
      }
    } catch (err) {
      console.error("Job refetch failed", err);
    }
  };

  const [confirmToggle, setConfirmToggle] = useState({
    show: false,
    field: null,
    currentValue: null,
  });

  useEffect(() => {
    const createOrFetchJob = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (job?.job_home_id) {
          const res = await api.get(`/job-homes/${job.job_home_id}`);
          setJobData(res.data);
          if (res.data.job_card?.id) {
            setJobCardId(res.data.job_card.id);
          } else {
            setJobCardId(null);
          }
        } else if (!job && id) {
          // From notification, fetch by id
          const res = await api.get(`/job-homes/${id}`);
          setJobData(res.data);
          if (res.data.job_card?.id) {
            setJobCardId(res.data.job_card.id);
          } else {
            setJobCardId(null);
          }
        } else {
          // For new jobs, create a new job home record in the backend
          const payload = {
            customer_id: null, // To be set from JobCard input later
            job_type: jobType,
            job_status: "Pending"
          };
          // We will create the job home record only when the JobCard component triggers creation with customer_id and other data
          // So here we just set jobData to null or empty and wait for JobCard to create the job home
          setJobData(null);
          setJobCardId(null);
        }
      } catch (err) {
        console.error("Job fetch failed", err);
        setError("Failed to load job. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    createOrFetchJob();
  }, [jobType, job?.job_home_id, id, job]);

  const handleToggle = useCallback((field) => {
    if (!jobData?.job_home?.id) return;
    setConfirmToggle({ show: true, field, currentValue: jobData.job_home[field] });
  }, [jobData]);

  const confirmToggleChange = async () => {
    const { field, currentValue } = confirmToggle;
    const newToggleValue = !currentValue;
    setConfirmToggle({ show: false, field: null, currentValue: null });

    setJobData(prev => ({
      ...prev,
      job_home: {
        ...prev.job_home,
        [field]: newToggleValue,
      },
    }));

    try {
      const res = await api.put(`/job-homes/${jobData.job_home.id}`, { [field]: newToggleValue });
      if (res.data?.id) {
        setJobData(prev => ({ ...prev, job_home: res.data }));
      }
    } catch (err) {
      console.error(`Failed to update ${field}`, err);
      setJobData(prev => ({
        ...prev,
        job_home: {
          ...prev.job_home,
          [field]: currentValue,
        },
      }));
    }
  };

  const renderToggle = (label, field) => (
    <div className="flex justify-between items-center px-4 py-2">
      <p className={`${isDarkMode ? "text-gray-300" : "text-gray-700"} text-sm font-medium`}>{label}</p>
      <label className={`relative inline-flex items-center ${isJobLocked ? 'cursor-not-allowed' : 'cursor-pointer'} ml-4`}>
        <input
          type="checkbox"
          className="sr-only peer"
          checked={jobData?.job_home?.[field] || false}
          onChange={() => !isJobLocked && handleToggle(field)}
          disabled={isJobLocked}
        />
        <div className={`w-11 h-6 rounded-full peer-checked:bg-green-500 transition-colors ease-in-out duration-200
          ${isDarkMode ? (isJobLocked ? "bg-gray-600" : "bg-gray-700 peer-focus:ring-green-800") : (isJobLocked ? "bg-gray-400" : "bg-gray-300 peer-focus:ring-green-300")}
          after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:ease-in-out after:duration-200
          peer-checked:after:translate-x-full peer-checked:after:border-white ${isJobLocked ? 'opacity-50' : ''}`}
        ></div>
      </label>
    </div>
  );

  const buttonBaseClasses = `py-2 px-5 rounded-lg shadow-md transition-all duration-300 flex items-center gap-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2`;
  const neutralButtonClasses = `${isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200 focus:ring-gray-500 focus:ring-offset-gray-900" : "bg-gray-200 hover:bg-gray-300 text-gray-700 focus:ring-gray-300 focus:ring-offset-gray-100"}`;
  const destructiveButtonClasses = `${isDarkMode ? "bg-red-700 hover:bg-red-800 text-white focus:ring-red-500 focus:ring-offset-gray-900" : "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 focus:ring-offset-gray-100"}`;
  const tabButtonClasses = (isActive) => `w-full py-3 px-4 sm:px-8 rounded-lg transition-all duration-300 text-base sm:text-lg font-semibold flex items-center justify-center gap-2 text-center
    ${isActive ? "bg-blue-600 text-white shadow-lg" : isDarkMode ? "bg-transparent text-gray-300 border border-gray-700 hover:bg-gray-700 hover:text-white" : "bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-100"}`;

  const currentJobStatus = useMemo(() => {
    if (!jobData?.job_home) return "Pending";
    if (jobData.job_home.job_status?.toLowerCase() === "complete") return "Completed";
    const { service_start, service_end, customer_ok, special_approve } = jobData.job_home;
    if (customer_ok) return "Customer Approved";
    if (service_end) return "Ended";
    if (service_start) return "In Process";
    return "Pending";
  }, [jobData]);

  const isJobLocked = useMemo(() => {
    const status = jobData?.job_home?.job_status?.toLowerCase();
    return status === 'cancel' || status === 'final' || currentJobStatus === 'Completed';
  }, [jobData, currentJobStatus]);

  // Banner notification state
  const [showCancelBanner, setShowCancelBanner] = React.useState(false);

  React.useEffect(() => {
    if (jobData?.job_home?.job_status?.toLowerCase() === 'cancel') {
      setShowCancelBanner(true);
    } else {
      setShowCancelBanner(false);
    }
  }, [jobData]);

  if (isLoading) {
    return <LoadingItems isDarkMode={isDarkMode} />;
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${isDarkMode ? "bg-gray-900 text-red-400" : "bg-red-100 text-red-800"}`}>
        <FaExclamationTriangle className="text-5xl mb-4" />
        <p className="text-xl font-semibold">{error}</p>
        <button onClick={handleGoBack} className={`bg-blue-600 hover:bg-blue-700 text-white ${buttonBaseClasses} mt-6`}>
          <FaArrowLeft /> Go Back
        </button>
      </div>
    );
  }

  // Professional Modal Design
  if (showCancelJob || showImageUpload || showPayment || showMessages || showAssignTechnicians) {
    return (
      <div
        className={`fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm ${
          isDarkMode ? "bg-black/80" : "bg-white/80"
        }`}
      >
        <div
          className={`relative w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden ${
            isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
          }`}
        >
          {/* HEADER BAR */}
          <div
            className={`flex justify-between items-center px-4 sm:px-6 py-4 border-b ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <h2 className="text-lg sm:text-xl font-semibold">
              {showCancelJob && "Cancel Job"}
              {showImageUpload && "Upload Images"}
              {showPayment && "Payment Details"}
              {showMessages && "Messages"}
              {showAssignTechnicians && "Assign Technicians"}
            </h2>
            <button
              onClick={() => {
                setShowCancelJob(false);
                setShowImageUpload(false);
                setShowPayment(false);
                setShowMessages(false);
                setShowAssignTechnicians(false);
              }}
              className="text-gray-400 hover:text-red-500 transition"
            >
              <FaTimes size={20} sm:size={22} />
            </button>
          </div>

          {/* CONTENT AREA */}
          <div className="p-4 sm:p-6 overflow-y-auto max-h-[75vh]">
            {showCancelJob && <CancelJobPage jobHomeId={jobData?.job_home?.id} />}
            {showImageUpload && (
              // FIX: Pass the jobHomeId prop here
              <ImageUpload jobHomeId={jobData?.job_home?.id} />
            )}
            {showPayment && <PaymentPage jobHomeId={jobData?.job_home?.id} jobCardId={jobCardId} onPaymentChange={refetchJobData} />}
            {showMessages && <Message jobHomeId={jobData?.job_home?.id} onClose={() => setShowMessages(false)} />}
            {showAssignTechnicians && (
              <AssignTechnicians
                jobHomeId={jobData?.job_home?.id}
                onClose={() => setShowAssignTechnicians(false)}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-6 px-4 sm:px-6 lg:px-8 ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}>
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-4 md:pb-6 border-b border-gray-200 dark:border-gray-700">
          <button className={`${neutralButtonClasses} ${buttonBaseClasses} mb-4 md:mb-0 mr-0 md:mr-4`} onClick={handleGoBack}>
            <FaArrowLeft className="text-base" /> Back to Jobs
          </button>
          <div className="flex flex-col items-center lg:items-end text-center lg:text-right flex-grow w-full md:w-auto">
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold ${isDarkMode ? "text-blue-400" : "text-blue-700"} mb-1`}>
              Job: {jobData?.job_home?.job_no ?? "N/A"}
            </h2>
            <p className={`text-lg sm:text-xl lg:text-2xl font-semibold ${isDarkMode ? "text-gray-100" : "text-gray-800"} mb-1`}>
              Customer: {jobData?.job_card?.customer_name ?? "Customer Name Not Set"}
            </p>
            <p className={`text-sm sm:text-base lg:text-lg ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Type: {jobData?.job_home?.job_type ?? "N/A"} | Date: {formatDateTime(jobData?.job_home?.created_at)}
            </p>
          </div>
        </div>

        {/* CANCELLATION DETAILS - Display after progress bar if job is cancelled */}
        {jobData?.job_home?.job_status?.toLowerCase() === 'cancel' && jobData?.cancellation && (
          <div className={`mb-8 p-6 rounded-xl border shadow-lg ${isDarkMode ? 'border-red-700 bg-red-900/20' : 'border-red-200 bg-red-50'}`}>
            <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-red-300' : 'text-red-800'}`}>
              Job Cancellation Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className={`text-sm font-semibold ${isDarkMode ? 'text-red-200' : 'text-red-700'}`}>
                  Reason:
                </p>
                <p className={`text-base ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  {jobData.cancellation.reason}
                </p>
              </div>
              {jobData.cancellation.description && (
                <div>
                  <p className={`text-sm font-semibold ${isDarkMode ? 'text-red-200' : 'text-red-700'}`}>
                    Description:
                  </p>
                  <p className={`text-base ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {jobData.cancellation.description}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Cancelled on: {formatDateTime(jobData.cancellation.created_at)}
              </p>
            </div>
          </div>
        )}

        {/* JOB COMPLETION DETAILS - Display if job is completed */}
        {currentJobStatus === "Completed" && (
          <div className={`mb-8 p-6 rounded-xl border shadow-lg ${isDarkMode ? 'border-green-700 bg-green-900/20' : 'border-green-200 bg-green-50'}`}>
            <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>
              Job Completed Successfully
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className={`text-sm font-semibold ${isDarkMode ? 'text-green-200' : 'text-green-700'}`}>
                  Completion Time:
                </p>
                <p className={`text-base ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  {jobData?.job_home?.service_end ? formatDateTime(jobData.job_home.updated_at) : 'N/A'}
                </p>
              </div>
              <div>
                <p className={`text-sm font-semibold ${isDarkMode ? 'text-green-200' : 'text-green-700'}`}>
                  Status:
                </p>
                <p className={`text-base ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Job has been completed and approved.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <ProgressBar
            special_approve={jobData?.job_home?.special_approve}
            customer_ok={jobData?.job_home?.customer_ok}
            service_start={jobData?.job_home?.service_start}
            service_end={jobData?.job_home?.service_end}
            payment={jobData?.payments?.reduce((sum, p) => sum + p.payment_amount, 0) || 0}
            job_status={jobData?.job_home?.job_status}
            isDarkMode={isDarkMode}
          />
        </div>

        

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 lg:gap-8 mt-6">
          {/* LEFT SIDE - Main Content Area */}
          <div className="lg:col-span-8 order-1 lg:order-1">
            {/* 🔹 Stepper replaces the old button grid */}
            <JobFlowStepper
              currentStep={selectedComponent}
              setCurrentStep={setSelectedComponent}
              jobCardId={jobCardId}
              quotationId={quotationId}
              isJobCancelled={isJobLocked}
              tabButtonClasses={tabButtonClasses}
            />

            <div>
              {selectedComponent === "JobCard" && (
                <JobCard
                  jobHomeId={jobData?.job_home?.id}
                  jobNo={jobData?.job_home?.job_no}
                  jobCardId={jobCardId}
                  isJobCancelled={isJobLocked}
                  service={job?.service || jobData?.job_home?.job_type || "Repair"}
                  onJobCreated={(createdJob) => {
                    setJobData(createdJob);
                    if (createdJob.job_card?.id) {
                      setJobCardId(createdJob.job_card.id);
                    }
                  }}
                />
              )}
              {selectedComponent === "Quotation" && (
                <Quotation jobCardId={jobCardId} jobNo={jobData?.job_home?.job_no} onQuotationCreated={setQuotationId} isJobCancelled={isJobLocked} />
              )}
              {selectedComponent === "Invoice" && <Invoice quotationId={quotationId} jobNo={jobData?.job_home?.job_no} isJobCancelled={isJobLocked} />}
            </div>
          </div>

          {/* RIGHT SIDE - Toggles and Actions */}
          <div className="lg:col-span-2 order-2 lg:order-2">
            {/* TOGGLES */}
            <div className={`p-4 rounded-xl border shadow-inner ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
              <h3 className={`text-lg sm:text-xl font-semibold mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Job Status Toggles</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-x-4 gap-y-3">
                {renderToggle("Service Start", "service_start")}
                {renderToggle("Service End", "service_end")}
                {(userRole === 'Administrator' || userRole === 'Tecnical_Head' || userRole === 'Manager') && (
                  renderToggle("Customer Approve", "customer_ok")
                )}
                {(userRole === 'Administrator' || userRole === 'Tecnical_Head') && (
                  renderToggle("Special Approve", "special_approve")
                )}
              </div>
            </div>

            {/* PAYMENT */}
            {(userRole === 'Administrator' || userRole === 'Tecnical_Head') && (
              <div className={`mt-6 p-4 rounded-xl border shadow-inner ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                <h3 className={`text-lg sm:text-xl font-semibold mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Payment</h3>
                
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowPayment(true)}
                    className={`bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-5 rounded-lg ${buttonBaseClasses} w-full`}
                  >
                    <FaMoneyBillWave className="text-lg" /> Payment
                  </button>
                </div>
              </div>
            )}

            {/* ACTIONS */}
            <div className={`mt-6 p-4 rounded-xl border shadow-inner ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
              <h3 className={`text-lg sm:text-xl font-semibold mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Actions</h3>
              <div className="flex flex-col gap-3">
                <button onClick={() => setShowImageUpload(true)} className={`${neutralButtonClasses} ${buttonBaseClasses} w-full`}>
                  <FaImage className="text-lg" /> Images
                </button>
                {(userRole === 'Administrator' || userRole === 'Tecnical_Head') && (
                  <button onClick={() => setShowMessages(true)} className={`${neutralButtonClasses} ${buttonBaseClasses} w-full`}>
                    <FaEnvelope className="text-lg" /> Message
                  </button>
                )}
              </div>

              {/* ASSIGN TECHNICIAN */}
              {(userRole === 'Administrator' || userRole === 'Tecnical_Head') && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowAssignTechnicians(true)}
                    disabled={isJobLocked}
                    className={`font-semibold py-2 px-5 rounded-lg ${buttonBaseClasses} w-full ${
                      isJobLocked
                        ? 'bg-gray-400 cursor-not-allowed opacity-50 text-gray-600'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <UserPlus className="text-lg mr-2" /> Assign Technician
                  </button>
                </div>
              )}
            </div>

            {/* CANCEL JOB */}
            {(userRole === 'Administrator' || userRole === 'Tecnical_Head') && (
              <div className={`mt-6 p-4 rounded-xl border shadow-inner ${
                isDarkMode
                  ? currentJobStatus === "Completed"
                    ? 'border-green-700 bg-green-900/20'
                    : 'border-gray-700 bg-gray-800'
                  : currentJobStatus === "Completed"
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-white'
              }`}>
                <h3 className={`text-lg sm:text-xl font-semibold mb-4 ${
                  isDarkMode
                    ? currentJobStatus === "Completed"
                      ? 'text-green-300'
                      : 'text-gray-200'
                    : currentJobStatus === "Completed"
                      ? 'text-green-800'
                      : 'text-gray-700'
                }`}>{
                  currentJobStatus === "Completed" ? "Job Completed" : "Cancel Job"
                }</h3>
                <div className="mt-2">
                  {currentJobStatus === "Completed" ? (
                    <button
                      disabled
                      className={`bg-green-600 text-white cursor-not-allowed opacity-70 ${buttonBaseClasses} w-full flex items-center justify-center`}
                    >
                      <CircleX className="text-lg mr-2" /> Job Completed
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowCancelJob(true)}
                      className={`${destructiveButtonClasses} ${buttonBaseClasses} w-full`}
                    >
                      <CircleX className="text-lg mr-2" /> Cancel Job
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      <ConfirmationModal
        show={confirmToggle.show}
        title="Confirm Action"
        message={`Are you sure you want to ${confirmToggle.currentValue ? "disable" : "enable"} ${confirmToggle.field?.replace(/_/g, " ")}?`}
        onConfirm={confirmToggleChange}
        onCancel={() => setConfirmToggle({ show: false, field: null, currentValue: null })}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default JobHome;