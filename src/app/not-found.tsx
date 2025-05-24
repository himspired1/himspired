"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Home, ShoppingBag } from "lucide-react"
import { colors } from "@/constants/colors"

export default function NotFound() {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 100,
      },
    },
  }

  const numberVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      y: [0, -10, 0],
      transition: {
        scale: {
          type: "spring",
          damping: 15,
          stiffness: 50,
          delay: 0.5,
        },
        y: {
          repeat: Number.POSITIVE_INFINITY,
          duration: 3,
          repeatType: "reverse",
          ease: "easeInOut",
          delay: 1.5,
        },
      },
    },
  }

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 100,
        delay: 0.8 + custom * 0.1,
      },
    }),
    hover: {
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
    tap: { scale: 0.95 },
  }

  const lineVariants = {
    hidden: { scaleX: 0 },
    visible: {
      scaleX: 1,
      transition: {
        delay: 0.7,
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <motion.div
        className="max-w-2xl w-full text-center py-16"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* 404 Number */}
        <motion.div className="relative mb-8" variants={numberVariants}>
          <h1 className="text-[120px] md:text-[180px] lg:text-[220px] font-moon leading-none">
            <span className="text-black">4</span>
            <span style={{ color: colors.primary_color }}>0</span>
            <span className="text-black">4</span>
          </h1>
        </motion.div>

        {/* Message */}
        <motion.h2
          className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 uppercase font-moon"
          variants={itemVariants}
        >
          Page Not Found
        </motion.h2>

        <motion.div
          className="h-0.5 w-24 mx-auto mb-6"
          style={{ backgroundColor: colors.primary_color, transformOrigin: "center" }}
          variants={lineVariants}
        />

        <motion.p className="text-gray-600 mb-8 max-w-md mx-auto" variants={itemVariants}>
          The page you`re looking for doesn`t exist or has been moved. Let us guide you back to our collection.
        </motion.p>

        {/* Buttons - with Go Back as the first button */}
        <motion.div className="flex flex-col sm:flex-row gap-4 justify-center w-full" variants={itemVariants}>
          {/* Go Back Button - Now First */}
          <motion.div
            custom={0}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            className="w-full sm:w-auto"
          >
            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 font-medium transition-all duration-300 w-full sm:min-w-[160px]"
            >
              <ArrowLeft size={18} />
              <span>Go Back</span>
            </button>
          </motion.div>

          {/* Home Button */}
          <motion.div
            custom={1}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            className="w-full sm:w-auto"
          >
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-black text-white font-medium transition-all duration-300 w-full sm:min-w-[160px]"
            >
              <Home size={18} />
              <span>Home</span>
            </Link>
          </motion.div>

          {/* Shop Button */}
          <motion.div
            custom={2}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            className="w-full sm:w-auto"
          >
            <Link
              href="/shop"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 w-full sm:min-w-[160px]"
              style={{ backgroundColor: colors.primary_color, color: "white" }}
            >
              <ShoppingBag size={18} />
              <span>Shop Collection</span>
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
