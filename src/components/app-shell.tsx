"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import Loader from "@/components/Loader"
import LoadingBar from "@/components/LoadingBar"
import { useLoading } from "@/context/LoadingContext"
import { motion, AnimatePresence } from "framer-motion"

export default function AppShell({ children }: { children: ReactNode }) {
  const { isLoading } = useLoading()
  const pathname = usePathname()
  const isHomePage = pathname === "/"
  const isAdminRoute = pathname.startsWith("/admin")
  const showLoader = isLoading && isHomePage

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
    </>
  )
}