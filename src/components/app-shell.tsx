"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import Loader from "@/components/Loader"
import LoadingBar from "@/components/LoadingBar"
import SocialMediaFollowModal from "@/components/modals/social-media-follow"
import { useLoading } from "@/context/LoadingContext"
import { useSocialMediaModal } from "@/hooks/useSocialMediaModal"
import { motion, AnimatePresence } from "framer-motion"

export default function AppShell({ children }: { children: ReactNode }) {
  const { isLoading } = useLoading()
  const pathname = usePathname()
  const isHomePage = pathname === "/"
  const isAdminRoute = pathname.startsWith("/admin")
  const showLoader = isLoading && isHomePage
  
  // Social media modal - only show on non-admin routes and after loading is complete
  const { isModalOpen, closeModal } = useSocialMediaModal({
    delayMs: 60000, // 60 seconds after page load
    sessionExpiryMs: 24 * 60 * 60 * 1000, // 24 hours before showing again
  })

  return (
    <>
      <LoadingBar />
      {showLoader && <Loader />}

      <AnimatePresence>
        {(!isLoading || !isHomePage) && (
          <motion.main
            className="flex-grow flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: isHomePage ? 0.3 : 0 }}
          >
            {!isAdminRoute && <Navbar />}
            
            <div className="flex-grow">{children}</div>
            {!isAdminRoute && <Footer />}
          </motion.main>
        )}
      </AnimatePresence>
      
      {/* Social Media Follow Modal - only show on non-admin routes */}
      {!isAdminRoute && (
        <SocialMediaFollowModal isOpen={isModalOpen} onClose={closeModal} />
      )}
    </>
  )
}