import React from "react";
import { FaTools, FaQuoteRight, FaFileInvoiceDollar, FaArrowRight } from "react-icons/fa";
import { useAuth } from "../../pages/hooks/useAuth";

export default function JobFlowStepper({
  currentStep,
  setCurrentStep,
  jobCardId,
  quotationId,
  isJobCancelled = false, // ✅ you had this, kept it for consistency
  tabButtonClasses,
}) {
  const { userRole } = useAuth();

  // ✅ Step configurations
  const steps = [
    {
      id: "JobCard",
      label: "Job Card",
      icon: <FaTools />,
      isEnabled: true,
      isVisible: true,
    },
    {
      id: "Quotation",
      label: "Quotation",
      icon: <FaQuoteRight />,
      isEnabled: !!jobCardId,
      isVisible: true,
    },
    {
      id: "Invoice",
      label: "Invoice",
      icon: <FaFileInvoiceDollar />,
      isEnabled: !!quotationId,
      isVisible: userRole === "Administrator" || userRole === "Technical_Head",
    },
  ];

  // ✅ Only show visible steps
  const visibleSteps = steps.filter((step) => step.isVisible);

  return (
    <div className="w-full flex flex-row justify-center items-center mb-6 gap-2 sm:gap-4">
      {visibleSteps.map((step, index) => {
        const isActive = currentStep === step.id;

        return (
          <div key={step.id} className="flex flex-row items-center">
            <button
              onClick={() => step.isEnabled && setCurrentStep(step.id)}
              disabled={!step.isEnabled}
              title={
                !step.isEnabled
                  ? `Complete ${visibleSteps[index - 1]?.label || "previous step"} first`
                  : ""
              }
              className={
                tabButtonClasses
                  ? `${tabButtonClasses(isActive)} ${
                      !step.isEnabled ? "opacity-50 cursor-not-allowed" : ""
                    }`
                  : `px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : step.isEnabled
                        ? "bg-gray-200 hover:bg-gray-300 text-gray-800"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`
              }
            >
              <span className="flex items-center justify-center gap-1 sm:gap-2">
                {step.icon}
                <span className="hidden sm:inline">{step.label}</span>
              </span>
            </button>

            {/* Arrow between steps */}
            {index < visibleSteps.length - 1 && (
              <div className="mx-2 sm:mx-4">
                <FaArrowRight
                  className={`text-sm sm:text-lg ${
                    visibleSteps[index + 1].isEnabled ? "text-gray-500" : "text-gray-300"
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
