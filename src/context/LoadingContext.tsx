"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type LoadingContextType = {
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)

  // Auto-hide loader after animation completes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 6500) // Match the animation duration in Loader.tsx

    return () => clearTimeout(timer)
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
