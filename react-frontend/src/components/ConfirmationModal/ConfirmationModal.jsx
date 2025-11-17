import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// Note: This is the enhanced JavaScript version without TypeScript syntax.
// If you are using TypeScript, you would define an interface here.

const ConfirmationModal = ({
  show,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm", // Added optional props with default values
  cancelLabel = "Cancel", // Added optional props with default values
  isDarkMode,
}) => {
  const modalRef = useRef(null);
  const confirmButtonRef = useRef(null);

  useEffect(() => {
    if (show) {
      // 1. Prevent background scrolling
      document.body.style.overflow = "hidden";

      // 2. Set initial focus
      confirmButtonRef.current?.focus();

      // 3. Handle keyboard events for accessibility (Tab and Escape)
      const handleKeyDown = (event) => {
        if (event.key === "Escape") {
          onCancel(); // Close modal on Escape key press
        } else if (event.key === "Tab") {
          const focusableElements = modalRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          
          if (!focusableElements || focusableElements.length === 0) return;

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (event.shiftKey) { // Shift + Tab
            if (document.activeElement === firstElement) {
              lastElement.focus();
              event.preventDefault();
            }
          } else { // Tab
            if (document.activeElement === lastElement) {
              firstElement.focus();
              event.preventDefault();
            }
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        // 4. Cleanup: Re-enable scrolling when modal unmounts or closes
        document.body.style.overflow = "";
      };
    }
  }, [show, onCancel]); // 'onCancel' is added as a dependency since it's used in the effect

  if (!show) return null;

  // 5. Use createPortal to render the modal outside the component tree
  return createPortal(
    <div
      className={`fixed inset-0 flex items-center justify-center z-[9999] p-4 transition-opacity duration-300 ease-in-out backdrop-blur-sm ${
        isDarkMode ? "bg-black/60" : "bg-gray-900/60"
      }`}
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        ref={modalRef}
        className={`relative p-6 rounded-lg shadow-2xl max-w-sm w-full transform transition-all duration-300 ease-out scale-100 ${
          isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id="modal-title"
          className={`text-xl font-bold mb-4 text-center ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          {title}
        </h3>
        <p
          id="modal-description"
          className={`mb-6 text-center text-sm ${
            isDarkMode ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {message}
        </p>
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
          <button
            onClick={onCancel}
            className={`w-full sm:w-auto px-6 py-2 rounded-lg font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isDarkMode
                ? "bg-gray-700 text-gray-200 hover:bg-gray-600 focus:ring-gray-500"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400"
            }`}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            className="w-full sm:w-auto px-6 py-2 rounded-lg bg-red-600 text-white font-semibold shadow-md hover:bg-red-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body // Portal destination
  );
};

export default ConfirmationModal;