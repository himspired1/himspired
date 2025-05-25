"use client"
import { Plus } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { SanityImageComponent } from "@/components/sanity/image"
import { useRouter } from "next/navigation"
import { MouseEvent, useEffect, useRef, useState } from "react"
import { useAppDispatch } from "@/redux/hooks"
import { addItem, CartItem } from "@/redux/slices/cartSlice"
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
  const router = useRouter();
  const [showSizes, setShowSizes] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setShowSizes(false);
      }
    };

    if (showSizes) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSizes]);
  // Create grid items based on itemsToShow
  const gridItems = []
  for (let i = 0; i < itemsToShow; i++) {
    if (i < products.length) {
      const product = products[i]
      const handleClick = (e: MouseEvent) => {
        e.stopPropagation();
        router.push(`/shop/${product._id}/${product.slug?.current}`);
      };

      const dispatch = useAppDispatch();
      const data: CartItem = {
        _id: product._id,
        title: product.title,
        category: product.category,
        mainImage: product.mainImage,
        price: product.price,
        quantity: 1,
        size: product.size
      };


      gridItems.push(
        <motion.div
          key={product._id}
          ref={cardRef}
          onClick={(e: MouseEvent) => handleClick(e)}
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
          {!showSizes && <motion.button
            className="mt-1.5 p-3 md:p-4 bg-white-200 w-fit rounded-full hover:bg-gray-200 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              if (product.size?.length === 0) {
                dispatch(addItem(data));
              }
              setShowSizes((prev) => !prev)
            }}
          >
            <Plus />
          </motion.button>}
          <AnimatePresence>
            {showSizes && (
              <motion.div

                className="flex gap-4"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.4 }}
              >
                {product.size?.map((size) => (
                  <motion.div
                    onClick={(e) => {
                      e.stopPropagation();
                      const cartData: CartItem = {
                        ...data,
                        size: [size]
                      }
                      dispatch(addItem(cartData))
                      setShowSizes((prev) => !prev)
                    }}
                    key={size}
                    className="px-4 py-2 font-medium bg-[#F4F4F4] rounded-full flex items-center justify-center text-sm font-activo uppercase text-[#1E1E1E] cursor-pointer hover:bg-[#DADADA] transition"
                    whileHover={{ scale: 1.1 }}
                  >
                    {size}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
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
