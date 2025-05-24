"use client"
import { Plus } from "lucide-react"
import { motion } from "framer-motion"
import { SanityImageComponent } from "@/components/sanity/image"
interface ProductSectionProps {
  itemsToShow?: number
  products: Product[]
}


const ProductSection = ({ itemsToShow = 4, products }: ProductSectionProps) => {
  // No need for displayItems state, gridItems is generated directly from products and itemsToShow

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

  // Create grid items based on itemsToShow
  const gridItems = []
  for (let i = 0; i < itemsToShow; i++) {
    if (i < products.length) {
      const product = products[i]
      gridItems.push(
        <motion.div
          key={product._id}
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
            <SanityImageComponent
              image={product.mainImage || "/placeholder.svg"}
              alt={product.title}
              width={0}
              height={0}
              className="w-auto h-auto md:px-7 py-3 md:py-4.5"
            />
            <div className="absolute inset-0 bg-black/0  transition-all duration-300 rounded-lg"></div>
          </motion.div>
          <div className="flex flex-col gap-y-2.5">
            <p className="text-gray-850/50 text-xs">{product.category}</p>
            <h3 className="text-gray-850 text-sm md:text-base whitespace-nowrap overflow-hidden text-ellipsis w-40">{product.title}</h3>
            <p className="text-gray-850 text-xs md:text-base">NGN {product.price.toLocaleString()}</p>
          </div>
          <motion.button
            className="mt-1.5 p-3 md:p-4 bg-white-200 w-fit rounded-full hover:bg-gray-200 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus />
          </motion.button>
        </motion.div>,
      )
    }
  }

  return (
    <motion.div
      className="flex flex-wrap justify-center gap-4 md:gap-6 lg:gap-8 text-center font-activo uppercase"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {gridItems}
    </motion.div>
  )
}

export default ProductSection
