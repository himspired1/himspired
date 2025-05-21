"use client"

import { thrifts } from "@/data/thrifts"
import Image from "next/image"
import { Plus } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect } from "react"

interface VintageProps {
  itemsToShow?: number
}

const Vintage = ({ itemsToShow = 4 }: VintageProps) => {
  // Log the itemsToShow value to verify it's correct
  useEffect(() => {
    console.log("Vintage component itemsToShow:", itemsToShow)
  }, [itemsToShow])

  // Only show the specified number of items
  const visibleThrifts = thrifts.slice(0, itemsToShow)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <motion.div
      className="flex flex-wrap justify-center gap-4 md:gap-6 lg:gap-8 text-center font-activo uppercase"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {visibleThrifts.map((thrift) => (
        <motion.div
          key={thrift.id}
          className="flex flex-col gap-y-2 items-center"
          variants={itemVariants}
          style={{
            width: `calc(${100 / itemsToShow}% - ${itemsToShow > 1 ? "2rem" : "0rem"})`,
          }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="relative group cursor-pointer"
          >
            <Image
              src={thrift.image || "/placeholder.svg"}
              alt={thrift.name}
              width={0}
              height={0}
              className="w-auto h-auto px-4 md:px-7 py-3 md:py-4.5"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300 rounded-lg"></div>
          </motion.div>
          <div className="flex flex-col gap-y-2.5">
            <p className="text-gray-850/50 text-xs">{thrift.type}</p>
            <h3 className="text-gray-850 text-base">{thrift.name}</h3>
            <p className="text-gray-850 text-base">NGN {thrift.price}</p>
          </div>
          <motion.button
            className="mt-1.5 p-3 md:p-4 bg-white-200 w-fit rounded-full hover:bg-gray-200 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus />
          </motion.button>
        </motion.div>
      ))}
    </motion.div>
  )
}

export default Vintage
