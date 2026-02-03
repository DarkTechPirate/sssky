import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Simple Close Icon
const CloseIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const Modal = ({ isOpen, onClose, title, description, children, theme }) => {
  // 1. Handle Scroll Lock, Layout Shift, Back Button & Escape Key
  useEffect(() => {
    if (isOpen) {
      // --- A. HISTORY & KEYBOARD LOGIC ---
      // Add state to history so back button closes modal
      window.history.pushState({ modalOpen: true }, "", window.location.href);

      const handlePopState = () => onClose();
      const handleKeyDown = (e) => {
        if (e.key === "Escape") onClose();
      };

      window.addEventListener("popstate", handlePopState);
      window.addEventListener("keydown", handleKeyDown);

      // --- B. SCROLL LOCKING LOGIC ---
      // 1. Calculate the width of the scrollbar to prevent layout shift
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      // 2. Save original styles to restore later
      const originalStyle = window.getComputedStyle(document.body).overflow;
      const originalPaddingRight = document.body.style.paddingRight;

      // 3. Apply Lock & Compensation
      // Only add padding if there is a scrollbar (width > 0)
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      document.body.style.overflow = "hidden";

      // --- CLEANUP ---
      return () => {
        window.removeEventListener("popstate", handlePopState);
        window.removeEventListener("keydown", handleKeyDown);

        // Restore body styles
        document.body.style.overflow = originalStyle;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isOpen, onClose]);

  // Safe theme fallbacks
  const overlayBg = theme?.navbar?.modalOverlay || "rgba(0, 0, 0, 0.6)";
  const modalBg = theme?.navbar?.modalBg || "#ffffff";
  const borderColor = theme?.navbar?.border || "rgba(0, 0, 0, 0.1)";
  const textColor = theme?.text || "#000000";
  const titleColor = theme?.navbar?.textHover || textColor;
  const descColor = theme?.navbar?.textIdle || "gray";
  const closeBtnBg = theme?.navbar?.searchBg || "transparent";
  const closeBtnColor = theme?.navbar?.textIdle || "currentColor";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ backgroundColor: overlayBg }}
          className="fixed inset-0 z-[100] backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose} // Close when clicking overlay
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()} // Prevent close when clicking content
            style={{
              backgroundColor: modalBg,
              borderColor: borderColor,
              borderWidth: "1px",
              boxShadow:
                theme?.navbar?.shadow ||
                "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
            className="w-full max-w-lg border rounded-3xl overflow-hidden relative flex flex-col max-h-[90vh]"
          >
            {/* Header Section */}
            <div className="p-6 pb-2 shrink-0">
              <div className="flex justify-between items-start mb-2">
                <h2
                  className="text-2xl font-bold leading-tight pr-8"
                  style={{ color: titleColor }}
                >
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  style={{
                    backgroundColor: closeBtnBg,
                    color: closeBtnColor,
                  }}
                  className="p-2 rounded-full transition-opacity hover:opacity-70 absolute top-5 right-5"
                >
                  <CloseIcon />
                </button>
              </div>

              {description && (
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: descColor }}
                >
                  {description}
                </p>
              )}
            </div>

            {/* Content / Buttons Section */}
            <div className="p-6 pt-4 overflow-y-auto custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
