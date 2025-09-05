"use client";
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Users } from "lucide-react";
import { Instagram, Tiktok } from "../../../public/images";
import Image from "next/image";
import { P, H } from "@/components/common/typography";

interface SocialMediaFollowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SocialMediaFollowModal: React.FC<SocialMediaFollowModalProps> = ({
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

  const socialLinks = [
    {
      name: "Instagram",
      href: "https://www.instagram.com/himspired.shop?igsh=MWV3NHd5ZTFpNThwdA%3D%3D&utm_source=qr",
      appUrl: "instagram://user?username=himspired.shop",
      icon: Instagram,
      color: "from-purple-600 to-pink-600",
      handle: "@himspired.shop",
    },
    {
      name: "TikTok",
      href: "https://www.tiktok.com/@himspired.shop?_t=ZM-8xxDhBrZKqu&_r=1",
      appUrl: "tiktok://user?username=himspired.shop",
      icon: Tiktok,
      color: "from-black to-red-600",
      handle: "@himspired.shop",
    },
  ];

  const handleSocialClick = (href: string, appUrl?: string) => {
    // Check if we're on mobile and have an app URL
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile && appUrl) {
      // Try to open the native app first using a more reliable method
      let appOpened = false;
      
      // For modern browsers, try window.open first
      try {
        const appWindow = window.open(appUrl, '_blank');
        
        // If window.open returns null or undefined, the app URL wasn't handled
        if (appWindow === null || appWindow === undefined) {
          // Fall back to web immediately
          window.open(href, "_blank", "noopener,noreferrer");
          return;
        }
        
        // Set a short timeout to check if app opened
        setTimeout(() => {
          if (!appOpened) {
            try {
              // Try to close the app window (will fail if app opened)
              appWindow.close();
              // If we can close it, app didn't open - go to web
              window.open(href, "_blank", "noopener,noreferrer");
            } catch {
              // If closing fails, app probably opened successfully
              appOpened = true;
            }
          }
        }, 1000);
        
        // Listen for window blur as backup indicator
        const onBlur = () => {
          appOpened = true;
          window.removeEventListener('blur', onBlur);
        };
        window.addEventListener('blur', onBlur);
        
      } catch {
        // If any error occurs, fall back to web
        console.log('App launch failed, opening web version');
        window.open(href, "_blank", "noopener,noreferrer");
      }
      
    } else {
      // Desktop or no app URL - open in new tab
      window.open(href, "_blank", "noopener,noreferrer");
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
              className="w-full max-w-md max-h-[90vh] overflow-y-auto"
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
                    <Users size={24} className="md:w-8 md:h-8" />
                    <div>
                      <H className="text-lg md:text-xl text-white font-moon">
                        Stay Connected!
                      </H>
                      <P className="text-xs md:text-sm text-white/80 font-activo">
                        Follow us for the latest updates
                      </P>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 md:p-6">
                  <div className="space-y-4 md:space-y-6">
                    {/* Main Message */}
                    <div className="text-center space-y-3">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", damping: 15 }}
                        className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#68191E] to-[#8B2635] rounded-full mx-auto"
                      >
                        <Heart size={32} className="text-white" fill="white" />
                      </motion.div>

                      <div>
                        <H className="text-lg md:text-xl text-gray-800 font-moon mb-2">
                          Don&apos;t Miss Out!
                        </H>
                        <P className="text-sm md:text-base text-gray-600 font-activo leading-relaxed">
                          Follow us on social media to get the latest fashion
                          updates, exclusive deals, new arrivals, and
                          behind-the-scenes content.
                        </P>
                      </div>
                    </div>

                    {/* Social Media Buttons */}
                    <div className="space-y-3">
                      {socialLinks.map((social, index) => (
                        <motion.button
                          key={social.name}
                          onClick={() => handleSocialClick(social.href, social.appUrl)}
                          className="w-full group relative overflow-hidden"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div
                            className={`bg-gradient-to-r ${social.color} rounded-lg p-4 text-white transition-all duration-300 group-hover:shadow-lg`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                                <Image
                                  src={social.icon}
                                  alt={social.name}
                                  className="w-full h-full\"
                                />
                              </div>
                              <div className="flex-1 text-left">
                                <P className="font-bold text-base font-moon">
                                  Follow us on {social.name}
                                </P>
                                <P className="text-sm opacity-90 font-activo">
                                  {social.handle}
                                </P>
                              </div>
                              <motion.div
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                whileHover={{ x: 5 }}
                              >
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 20 20"
                                  fill="none"
                                  className="text-white"
                                >
                                  <path
                                    d="M7.5 15L12.5 10L7.5 5"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </motion.div>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    {/* Benefits */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <H className="text-sm font-bold text-gray-800 font-moon mb-2">
                        What you&apos;ll get:
                      </H>
                      <ul className="space-y-1">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-[#68191E] rounded-full"></div>
                          <P className="text-xs text-gray-700 font-activo">
                            First access to new collections
                          </P>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-[#68191E] rounded-full"></div>
                          <P className="text-xs text-gray-700 font-activo">
                            Exclusive promotional offers
                          </P>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-[#68191E] rounded-full"></div>
                          <P className="text-xs text-gray-700 font-activo">
                            Style tips and fashion inspiration
                          </P>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6">
                    <button
                      onClick={onClose}
                      className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium font-activo uppercase text-sm"
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-4 md:px-6 py-3 border-t">
                  <P className="text-xs text-gray-600 text-center font-activo">
                    Stay updated with Himspired - Where thrift meets luxury
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

export default SocialMediaFollowModal;
