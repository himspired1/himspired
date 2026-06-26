"use client";
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Mail } from "lucide-react";
import { P, H } from "@/components/common/typography";

interface RefundPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RefundPolicyModal: React.FC<RefundPolicyModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={handleOverlayClick}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, type: "spring", damping: 25 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-[#68191E] text-white p-4 md:p-6 relative">
                  <button
                    onClick={onClose}
                    className="absolute right-3 md:right-4 top-3 md:top-4 text-white/80 hover:text-white transition-colors"
                  >
                    <X size={20} className="md:w-6 md:h-6" />
                  </button>

                  <div className="flex items-center gap-3">
                    <Shield size={24} className="md:w-8 md:h-8" />
                    <div>
                      <H className="text-lg md:text-xl text-white font-moon">
                        Refund Policy
                      </H>
                      <P className="text-xs md:text-sm text-white/80 font-activo">
                        Our commitment to customer satisfaction
                      </P>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 md:p-6">
                  <div className="space-y-4 md:space-y-6">
                    {/* Main Policy */}
                    <div className="space-y-3 md:space-y-4">
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 md:p-4 rounded-r-lg">
                        <P className="text-sm md:text-base text-gray-800 font-activo leading-relaxed">
                          At <strong>HIMSPIRED</strong>, we take pride in
                          ensuring that all listed items are available and ready
                          for delivery. However, in rare and extreme cases where
                          an item becomes unavailable after purchase due to a
                          system error, we will process a full refund within{" "}
                          <strong>3 working days</strong>.
                        </P>
                      </div>

                      <div className="bg-amber-50 border-l-4 border-amber-400 p-3 md:p-4 rounded-r-lg">
                        <P className="text-sm md:text-base text-gray-800 font-activo leading-relaxed">
                          Please note that we do not accept returns or issue
                          refunds for items that were successfully delivered.
                          All purchases are considered final, so we encourage
                          customers to review item details carefully before
                          completing their order.
                        </P>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                      <div className="flex items-start gap-3">
                        <Mail
                          size={18}
                          className="text-[#68191E] mt-0.5 md:w-5 md:h-5"
                        />
                        <div>
                          <P className="text-xs md:text-sm font-medium text-gray-800 font-activo mb-1">
                            Questions or Concerns?
                          </P>
                          <P className="text-xs md:text-sm text-gray-600 font-activo">
                            If you have any questions or concerns, feel free to
                            reach out to our support team at{" "}
                            <a
                              href="mailto:thehimspiredshop@gmail.com"
                              className="text-[#68191E] hover:underline font-medium"
                            >
                              thehimspiredshop@gmail.com
                            </a>
                          </P>
                        </div>
                      </div>
                    </div>

                    {/* Key Points */}
                    <div className="space-y-2 md:space-y-3">
                      <H className="text-base md:text-lg text-gray-800 font-moon">
                        Key Points:
                      </H>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-[#68191E] rounded-full mt-2 flex-shrink-0"></div>
                          <P className="text-xs md:text-sm text-gray-700 font-activo">
                            Full refunds processed within 3 working days for
                            system errors
                          </P>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-[#68191E] rounded-full mt-2 flex-shrink-0"></div>
                          <P className="text-xs md:text-sm text-gray-700 font-activo">
                            No returns or refunds for successfully delivered
                            items
                          </P>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-[#68191E] rounded-full mt-2 flex-shrink-0"></div>
                          <P className="text-xs md:text-sm text-gray-700 font-activo">
                            All purchases are final - review items carefully
                            before ordering
                          </P>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end mt-4 md:mt-6">
                    <button
                      onClick={onClose}
                      className="px-4 md:px-6 py-2 md:py-3 bg-[#68191E] text-white rounded-lg hover:bg-[#5a1519] transition-colors font-medium font-activo uppercase text-sm md:text-base"
                    >
                      Got It
                    </button>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-4 md:px-6 py-3 md:py-4 border-t">
                  <P className="text-xs text-gray-600 text-center font-activo">
                    This policy is effective as of the date of purchase and may
                    be updated periodically
                  </P>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RefundPolicyModal;
