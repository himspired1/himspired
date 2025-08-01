"use client";
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Truck, Mail, Clock, Phone } from "lucide-react";
import { P, H } from "@/components/common/typography";

interface DeliveriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeliveriesModal: React.FC<DeliveriesModalProps> = ({
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
                    <Truck size={24} className="md:w-8 md:h-8" />
                    <div>
                      <H className="text-lg md:text-xl text-white font-moon">
                        Delivery Information
                      </H>
                      <P className="text-xs md:text-sm text-white/80 font-activo">
                        How we get your orders to you
                      </P>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 md:p-6">
                  <div className="space-y-4 md:space-y-6">
                    {/* Order Processing */}
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 md:p-4 rounded-r-lg">
                      <div className="flex items-start gap-3">
                        <Clock
                          size={20}
                          className="text-blue-600 mt-0.5 flex-shrink-0"
                        />
                        <div>
                          <P className="text-sm md:text-base text-gray-800 font-activo leading-relaxed">
                            Once your payment is confirmed by our admin team,
                            your order will be scheduled for delivery. We
                            process and dispatch deliveries once a week, so
                            please bear this in mind when placing your order.
                          </P>
                        </div>
                      </div>
                    </div>

                    {/* Email Notification */}
                    <div className="bg-green-50 border-l-4 border-green-400 p-3 md:p-4 rounded-r-lg">
                      <div className="flex items-start gap-3">
                        <Mail
                          size={20}
                          className="text-green-600 mt-0.5 flex-shrink-0"
                        />
                        <div>
                          <P className="text-sm md:text-base text-gray-800 font-activo leading-relaxed">
                            As soon as your order is sent out, you&apos;ll
                            receive an email notification letting you know that
                            your delivery is on the way.
                          </P>
                        </div>
                      </div>
                    </div>

                    {/* Order Tracking */}
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-3 md:p-4 rounded-r-lg">
                      <div className="flex items-start gap-3">
                        <Truck
                          size={20}
                          className="text-amber-600 mt-0.5 flex-shrink-0"
                        />
                        <div>
                          <P className="text-sm md:text-base text-gray-800 font-activo leading-relaxed">
                            To track your order, simply click the &quot;Track
                            Orders&quot; link at the footer of the website which 
                            opens the Track Orders modal. Enter your order number
                            to view the current status of your delivery.
                          </P>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Confirmation */}
                    <div className="bg-purple-50 border-l-4 border-purple-400 p-3 md:p-4 rounded-r-lg">
                      <div className="flex items-start gap-3">
                        <Phone
                          size={20}
                          className="text-purple-600 mt-0.5 flex-shrink-0"
                        />
                        <div>
                          <P className="text-sm md:text-base text-gray-800 font-activo leading-relaxed">
                            When your order has been delivered, you&apos;ll
                            receive another email confirmation, and the driver
                            or delivery company will also call you to notify you
                            that your order has arrived and is ready for
                            pick-up.
                          </P>
                        </div>
                      </div>
                    </div>

                    {/* Thank You Message */}
                    <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                      <P className="text-sm md:text-base text-gray-700 font-activo leading-relaxed text-center">
                        Thank you for your patience and for shopping with us.
                      </P>
                    </div>

                    {/* Key Points */}
                    <div className="space-y-3">
                      <H className="text-base md:text-lg text-gray-800 font-moon">
                        Delivery Process:
                      </H>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-[#68191E] rounded-full mt-2 flex-shrink-0"></div>
                          <P className="text-xs md:text-sm text-gray-700 font-activo">
                            Payment confirmation triggers delivery scheduling
                          </P>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-[#68191E] rounded-full mt-2 flex-shrink-0"></div>
                          <P className="text-xs md:text-sm text-gray-700 font-activo">
                            Weekly dispatch schedule (once per week)
                          </P>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-[#68191E] rounded-full mt-2 flex-shrink-0"></div>
                          <P className="text-xs md:text-sm text-gray-700 font-activo">
                            Email notifications at each stage
                          </P>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-[#68191E] rounded-full mt-2 flex-shrink-0"></div>
                          <P className="text-xs md:text-sm text-gray-700 font-activo">
                            Phone call notification upon delivery
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
                    Track your orders using the Track Orders feature in the
                    footer
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

export default DeliveriesModal;
