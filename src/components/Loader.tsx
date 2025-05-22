"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"

const Loader = () => {
  const [welcomeText, setWelcomeText] = useState("")
  const [brandText, setBrandText] = useState("")
  const [showWelcome, setShowWelcome] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)
  const welcomeFullText = "Welcome to"
  const brandFullText = "HIMSPIRED"
  const [welcomeIndex, setWelcomeIndex] = useState(0)
  const [brandIndex, setBrandIndex] = useState(0)
  const [startBrandTyping, setStartBrandTyping] = useState(false)

  const splitBrandText = (text: string) => {
    const him = text.slice(0, 3)
    const spired = text.slice(3)
    return (
      <>
        <span className="text-[#68191E]">{him}</span>
        <span className="text-black font-kiona">{spired}</span>
      </>
    )
  }

  useEffect(() => {
    if (welcomeIndex < welcomeFullText.length) {
      const timer = setTimeout(() => {
        setWelcomeText((current) => current + welcomeFullText[welcomeIndex])
        setWelcomeIndex((current) => current + 1)
      }, 100)
      return () => clearTimeout(timer)
    } else {
      const hideWelcomeTimer = setTimeout(() => {
        setShowWelcome(false)
      }, 800)

      const startBrandTimer = setTimeout(() => {
        setStartBrandTyping(true)
      }, 1000)

      return () => {
        clearTimeout(hideWelcomeTimer)
        clearTimeout(startBrandTimer)
      }
    }
  }, [welcomeIndex])

  useEffect(() => {
    if (startBrandTyping && brandIndex < brandFullText.length) {
      const timer = setTimeout(() => {
        setBrandText((current) => current + brandFullText[brandIndex])
        setBrandIndex((current) => current + 1)
      }, 100)
      return () => clearTimeout(timer)
    } else if (startBrandTyping && brandIndex === brandFullText.length) {
      const fadeTimer = setTimeout(() => {
        setFadeOut(true)
      }, 1500)

      return () => {
        clearTimeout(fadeTimer)
      }
    }
  }, [startBrandTyping, brandIndex])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white"
      initial={{ opacity: 1 }}
      animate={{ opacity: fadeOut ? 0 : 1 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
    >
      <motion.div
        className="text-center flex flex-col gap-4"
        animate={{ scale: fadeOut ? 1.25 : 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      >
        {showWelcome && (
          <h2 className="lg:text-[40px] text-[25px] font-kiona transition-all duration-500 ease-in-out opacity-100">
            {welcomeText}
            {welcomeIndex < welcomeFullText.length && <span className="animate-pulse">|</span>}
          </h2>
        )}
        <h2 className="lg:text-[120px] text-[65px] font-moon">
          {splitBrandText(brandText)}
          {startBrandTyping && brandIndex < brandFullText.length && <span className="animate-pulse">|</span>}
        </h2>
      </motion.div>
    </motion.div>
  )
}

export default Loader
