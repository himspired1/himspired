"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type LoadingContextType = {
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check if we're on the client side
    if (typeof window === "undefined") return

    // Check if loader has already been shown in this session
    const hasShownLoader = sessionStorage.getItem("himspired_loader_shown")
    
    // Only show loader if it hasn't been shown in this session
    if (!hasShownLoader) {
      setIsLoading(true)
      
      // Mark that we've shown the loader in this session
      sessionStorage.setItem("himspired_loader_shown", "true")
    }
  }, [])

  return <LoadingContext.Provider value={{ isLoading, setIsLoading }}>{children}</LoadingContext.Provider>
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider")
  }
  return context
}