"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Package, ArrowRight } from "lucide-react";
import { P, H } from "@/components/common/typography";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TrackOrderModal: React.FC<TrackOrderModalProps> = ({ isOpen, onClose }) => {
  const [orderId, setOrderId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    
    const orderIdPattern = /^HIM-\d{13}$/;
    
    if (!orderId.trim()) {
      toast.error("Please enter your order ID");
      return;
    }
    
    if (!orderIdPattern.test(orderId.trim())) {
      toast.error("Invalid order ID format. Example: HIM-1234567890123");
      return;
    }

    setIsSubmitting(true);

    try {
      
      router.push(`/order-success?orderId=${orderId.trim()}`);
      onClose();
      setOrderId("");
    } catch (error) {
      console.error("Navigation error:", error);
      toast.error("Failed to track order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

          
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, type: "spring", damping: 25 }}
              className="w-full max-w-md"
            >
              <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-[#68191E] text-white p-6 relative">
                  <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                  
                  <div className="flex items-center gap-3">
                    <Package size={32} />
                    <div>
                      <H className="text-xl text-white font-moon">Track Your Order</H>
                      <P className="text-sm text-white/80 font-activo">Enter your order ID to view status</P>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="orderId" className="block mb-2">
                        <P className="text-sm font-medium text-gray-700 uppercase font-activo">
                          Order ID
                        </P>
                      </label>
                      <input
                        type="text"
                        id="orderId"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                        placeholder="HIM-1234567890123"
                        disabled={isSubmitting}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#68191E] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed uppercase font-mono"
                        autoFocus
                      />
                      <P className="text-xs text-gray-500 mt-2 font-activo">
                        Your order ID was sent to your email after purchase
                      </P>
                    </div>

                    {/* Example */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <P className="text-xs text-gray-600 font-activo">
                        <strong>Example:</strong> HIM-1752283645478
                      </P>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium font-activo uppercase"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-[#68191E] text-white rounded-lg hover:bg-[#5a1519] transition-colors font-medium font-activo uppercase disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          Track Order
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Footer Help */}
                <div className="bg-gray-50 px-6 py-4 border-t">
                  <P className="text-xs text-gray-600 text-center font-activo">
                    Can`t find your order ID? Contact us at{" "}
                    <a href={`mailto:${process.env.NEXT_PUBLIC_EMAIL || 'support@himspired.com'}`} className="text-[#68191E] hover:underline">
                      thehimspiredshop@gmail.com
                    </a>
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

export default TrackOrderModal;