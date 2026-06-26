"use client";
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Store, Mail, MapPin } from "lucide-react";
import { P, H } from "@/components/common/typography";

interface StoreInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const StoreInfoModal: React.FC<StoreInfoModalProps> = ({ isOpen, onClose }) => {
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
                    <Store size={24} className="md:w-8 md:h-8" />
                    <div>
                      <H className="text-lg md:text-xl text-white font-moon">
                        Store Information
                      </H>
                      <P className="text-xs md:text-sm text-white/80 font-activo">
                        Our current operations
                      </P>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 md:p-6">
                  <div className="space-y-4 md:space-y-6">
                    {/* Current Status */}
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 md:p-4 rounded-r-lg">
                      <div className="flex items-start gap-3">
                        <MapPin
                          size={20}
                          className="text-blue-600 mt-0.5 flex-shrink-0"
                        />
                        <div>
                          <P className="text-sm md:text-base text-gray-800 font-activo leading-relaxed">
                            At the moment, we do not have a physical store
                            location. All our operations are currently handled
                            directly from our warehouse to keep things
                            streamlined and efficient.
                          </P>
                        </div>
                      </div>
                    </div>

                    {/* Future Plans */}
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-3 md:p-4 rounded-r-lg">
                      <div className="flex items-start gap-3">
                        <Store
                          size={20}
                          className="text-amber-600 mt-0.5 flex-shrink-0"
                        />
                        <div>
                          <P className="text-sm md:text-base text-gray-800 font-activo leading-relaxed">
                            As we continue to grow, we plan to open physical
                            stores soon. Once we do, our customers will be the
                            first to know, updates will be shared via our
                            newsletter.
                          </P>
                        </div>
                      </div>
                    </div>

                    {/* Newsletter Reminder */}
                    <div className="bg-green-50 border-l-4 border-green-400 p-3 md:p-4 rounded-r-lg">
                      <div className="flex items-start gap-3">
                        <Mail
                          size={20}
                          className="text-green-600 mt-0.5 flex-shrink-0"
                        />
                        <div>
                          <P className="text-sm md:text-base text-gray-800 font-activo leading-relaxed">
                            If you haven&apos;t subscribed already, be sure to subscribe so you
                            don&apos;t miss any announcements.
                          </P>
                        </div>
                      </div>
                    </div>

                    {/* Thank You Message */}
                    <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                      <P className="text-sm md:text-base text-gray-700 font-activo leading-relaxed text-center">
                        Thank you for shopping with us and being part of our
                        journey!
                      </P>
                    </div>

                    {/* Key Points */}
                    <div className="space-y-3">
                      <H className="text-base md:text-lg text-gray-800 font-moon">
                        Current Setup:
                      </H>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-[#68191E] rounded-full mt-2 flex-shrink-0"></div>
                          <P className="text-xs md:text-sm text-gray-700 font-activo">
                            Direct warehouse-to-customer operations
                          </P>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-[#68191E] rounded-full mt-2 flex-shrink-0"></div>
                          <P className="text-xs md:text-sm text-gray-700 font-activo">
                            Streamlined and efficient delivery process
                          </P>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-[#68191E] rounded-full mt-2 flex-shrink-0"></div>
                          <P className="text-xs md:text-sm text-gray-700 font-activo">
                            Physical stores coming soon
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
                    Stay updated with our newsletter for store opening
                    announcements
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

export default StoreInfoModal;
