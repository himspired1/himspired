import { useEffect, useState, useRef } from "react";
import { SessionManager } from "@/lib/session";

interface UseSocialMediaModalOptions {
  delayMs?: number; // Delay before showing modal (default: 60 seconds)
  sessionExpiryMs?: number; // How long to remember that user has seen modal
}

const MODAL_SHOWN_KEY = "himspired_social_modal_shown";
const MODAL_SESSION_KEY = "himspired_social_modal_session";

export const useSocialMediaModal = (options: UseSocialMediaModalOptions = {}) => {
  const { delayMs = 60000, sessionExpiryMs = 24 * 60 * 60 * 1000 } = options; // 60 seconds delay, 24 hours expiry
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mountTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const currentSessionId = SessionManager.getSessionId();
    const lastShownSession = localStorage.getItem(MODAL_SESSION_KEY);
    const lastShownTime = localStorage.getItem(MODAL_SHOWN_KEY);
    
    // Check if this is a fresh session (new session ID or expired session)
    const isNewSession = !lastShownSession || lastShownSession !== currentSessionId;
    
    // Check if enough time has passed since last shown (24 hours by default)
    const isExpired = !lastShownTime || 
      (Date.now() - parseInt(lastShownTime)) > sessionExpiryMs;

    // Only show modal if:
    // 1. It's a new session OR enough time has passed
    // 2. User hasn't been shown the modal in this session yet
    const shouldShow = (isNewSession || isExpired) && !shouldShowModal;

    if (shouldShow) {
      // Set up timer to show modal after delay
      timerRef.current = setTimeout(() => {
        setShouldShowModal(true);
      }, delayMs);

      // Log for debugging
      console.log("Social media modal timer set:", {
        delayMs,
        currentSession: currentSessionId,
        lastShownSession,
        isNewSession,
        isExpired
      });
    } else {
      console.log("Social media modal not scheduled:", {
        shouldShow,
        isNewSession,
        isExpired,
        currentSession: currentSessionId,
        lastShownSession
      });
    }

    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [delayMs, sessionExpiryMs, shouldShowModal]);

  // Auto-open modal when shouldShowModal becomes true
  useEffect(() => {
    if (shouldShowModal && !isModalOpen) {
      setIsModalOpen(true);
    }
  }, [shouldShowModal, isModalOpen]);

  const closeModal = () => {
    setIsModalOpen(false);
    setShouldShowModal(false);
    
    // Record that modal was shown for this session
    const currentSessionId = SessionManager.getSessionId();
    localStorage.setItem(MODAL_SESSION_KEY, currentSessionId);
    localStorage.setItem(MODAL_SHOWN_KEY, Date.now().toString());
    
    console.log("Social media modal closed and recorded for session:", currentSessionId);
  };

  const resetModalState = () => {
    // Utility function for testing - clears all modal-related storage
    localStorage.removeItem(MODAL_SESSION_KEY);
    localStorage.removeItem(MODAL_SHOWN_KEY);
    setShouldShowModal(false);
    setIsModalOpen(false);
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    console.log("Social media modal state reset");
  };

  // Debugging utility - get current state
  const getModalState = () => {
    if (typeof window === "undefined") return null;
    
    return {
      shouldShowModal,
      isModalOpen,
      currentSession: SessionManager.getSessionId(),
      lastShownSession: localStorage.getItem(MODAL_SESSION_KEY),
      lastShownTime: localStorage.getItem(MODAL_SHOWN_KEY),
      mountTime: mountTimeRef.current,
      timeUntilShow: timerRef.current ? delayMs - (Date.now() - mountTimeRef.current) : null
    };
  };

  return {
    isModalOpen,
    closeModal,
    resetModalState, // For testing/debugging
    getModalState, // For testing/debugging
  };
};