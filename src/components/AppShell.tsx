'use client';

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Loader from "@/components/Loader";
import { useLoading } from "@/context/LoadingContext";
import { motion, AnimatePresence } from "framer-motion";

export default function AppShell({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  
  // Only access the loading context after component mounts
  const { isLoading } = useLoading();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything on server or until mounted
  if (!mounted) {
    return (
      <main className="flex-grow flex flex-col">
        <Navbar />
        <div className="flex-grow">{children}</div>
        <Footer />
      </main>
    );
  }

  const isHomePage = pathname === "/";
  const showLoader = isLoading && isHomePage;

  return (
    <>
      {showLoader && <Loader />}
      <AnimatePresence>
        {(!isLoading || !isHomePage) && (
          <motion.main
            className="flex-grow flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: isHomePage ? 0.3 : 0 }}
          >
            <Navbar />
            <div className="flex-grow">{children}</div>
            <Footer />
          </motion.main>
        )}
      </AnimatePresence>
    </>
  );
}