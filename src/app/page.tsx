"use client"

import { motion } from "framer-motion"
import Fashion from "./_Home/components/Fashion"
import Newsletter from "./_Home/components/Newsletter"
import Owners from "./_Home/components/Owners"
import Products from "./_Home/components/Products"
import { useLoading } from "@/context/LoadingContext"

export default function Home() {
  const { isLoading } = useLoading()

  // Animation variants for staggered section reveals
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2,
      },
    },
  }

  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
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

  if (isLoading) return null

  return (
    <motion.div className="font-activo" initial="hidden" animate="visible" variants={containerVariants}>
      <motion.div variants={sectionVariants}>
        <Products />
      </motion.div>

      <motion.div variants={sectionVariants}>
        <Owners />
      </motion.div>

      <motion.div variants={sectionVariants}>
        <Fashion />
      </motion.div>

      <motion.div variants={sectionVariants}>
        <Newsletter />
      </motion.div>
    </motion.div>
  )
}
