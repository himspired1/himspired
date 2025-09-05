"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function LoadingBar() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  // Expose function to start loading
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).startPageLoading = () => setLoading(true);
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1">
      <div 
        className="h-full bg-gradient-to-r from-[#8B4513] to-[#D2691E]"
        style={{
          animation: "loadingBar 2s ease-in-out infinite"
        }}
      />
      <style jsx>{`
        @keyframes loadingBar {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}