"use client"
import { Plus, Check } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { SanityImageComponent } from "@/components/sanity/image"
import { useRouter } from "next/navigation"
import { MouseEvent, useEffect, useRef, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { addItem, CartItem, selectCartItemQuantity } from "@/redux/slices/cartSlice"
import React from "react"
import type { Variants } from "framer-motion"

interface ProductSectionProps {
  itemsToShow?: number
  products: Product[]
}

const ProductSection = ({ itemsToShow = 4, products }: ProductSectionProps) => {
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
        <ProductItem 
          key={product._id} 
          product={product} 
          itemsToShow={itemsToShow}
          variants={itemVariants}
        />
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

const ProductItem = ({ 
  product, 
  itemsToShow, 
  variants 
}: { 
  product: Product; 
  itemsToShow: number;
  variants: Variants | undefined;
}) => {
  const [showSizes, setShowSizes] = useState(false);
  const [addedToCart, setAddedToCart] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    router.push(`/shop/${product._id}/${product.slug?.current}`);
  };

  // Get cart quantity for products without sizes (moved outside of callback)
  const cartQuantity = useAppSelector(state => 
    selectCartItemQuantity(state, product._id, product.size?.[0] || "")
  );

  // Get cart quantities for all sizes (moved outside of callback)
  const sizeQuantities = useAppSelector(state => {
    const quantities: Record<string, number> = {};
    if (product.size) {
      product.size.forEach(sizeOption => {
        quantities[sizeOption] = selectCartItemQuantity(state, product._id, sizeOption);
      });
    }
    return quantities;
  });

  const handleAddToCart = (selectedSize?: string) => {
    // Fixed: Updated to match new CartItem interface
    const data: Omit<CartItem, "quantity" | "originalPrice" | "originalProductId"> = {
      _id: product._id,
      title: product.title,
      category: product.category,
      mainImage: product.mainImage,
      price: product.price,
      size: selectedSize || product.size?.[0] || ""
    };

    dispatch(addItem(data));
    
    // Show feedback animation
    setAddedToCart(selectedSize || "default");
    setTimeout(() => setAddedToCart(null), 1500);
  };

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

  return (
    <motion.div
      ref={cardRef}
      onClick={handleClick}
      className="flex flex-col gap-y-2 items-center cursor-pointer"
      variants={variants}
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
        <div className="absolute inset-0 bg-black/0 transition-all duration-300 rounded-lg"></div>
      </motion.div>
      
      <div className="flex flex-col gap-y-2.5">
        <p className="text-gray-850/50 text-xs">{product.category}</p>
        <h3 className="text-gray-850 text-sm md:text-base whitespace-nowrap overflow-hidden text-ellipsis w-40">
          {product.title}
        </h3>
        <p className="text-gray-850 text-xs md:text-base">NGN {product.price.toLocaleString()}</p>
      </div>

      {!showSizes && (
        <motion.button
          className={`mt-1.5 p-3 md:p-4 w-fit rounded-full transition-all duration-300 ${
            addedToCart === "default" 
              ? "bg-green-100 border-2 border-green-500" 
              : "bg-white-200 hover:bg-gray-200"
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            if (!product.size?.length) {
              handleAddToCart();
            } else {
              setShowSizes(true);
            }
          }}
        >
          {addedToCart === "default" ? (
            <Check color="#22c55e" />
          ) : (
            <Plus />
          )}
        </motion.button>
      )}

      {!product.size?.length && cartQuantity > 0 && (
        <p className="text-xs text-[#68191E] font-medium">
          In cart: {cartQuantity}
        </p>
      )}

      <AnimatePresence>
        {showSizes && (
          <motion.div
            className="flex gap-4 flex-wrap justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
          >
            {product.size?.map((sizeOption) => {
              const sizeCartQuantity = sizeQuantities[sizeOption] || 0;
              
              return (
                <motion.div
                  key={sizeOption}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(sizeOption);
                    setShowSizes(false);
                  }}
                  className={`px-4 py-2 font-medium rounded-full flex flex-col items-center justify-center text-sm font-activo uppercase cursor-pointer transition-all duration-300 ${
                    addedToCart === sizeOption
                      ? "bg-green-100 border-2 border-green-500 text-green-700"
                      : "bg-[#F4F4F4] hover:bg-[#DADADA] text-[#1E1E1E]"
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>{sizeOption}</span>
                  {sizeCartQuantity > 0 && (
                    <span className="text-xs text-[#68191E] font-medium">
                      ({sizeCartQuantity})
                    </span>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default React.memo(ProductSection)