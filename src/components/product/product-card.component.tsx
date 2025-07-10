import { P } from "../common/typography";
import { Plus, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { MouseEvent, useEffect, useRef, useState } from "react";
import { addItem, CartItem, selectCartItemQuantity } from "@/redux/slices/cartSlice";
import { SanityImageComponent } from "../sanity/image";

interface ProductProps extends Product {
  className?: string;
  delay?: number;
}

const ProductCard = ({
  title,
  className = "",
  category,
  price,
  mainImage,
  _id,
  delay,
  size,
  slug,
}: ProductProps) => {
  const router = useRouter();
  const [showSizes, setShowSizes] = useState(false);
  const [addedToCart, setAddedToCart] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    router.push(`/shop/${_id}/${slug?.current}`);
  };

  // Get cart quantity for products without sizes (moved outside of callback)
  const cartQuantity = useAppSelector(state => 
    selectCartItemQuantity(state, _id, size?.[0] || "")
  );

  // Get cart quantities for all sizes (moved outside of callback)
  const sizeQuantities = useAppSelector(state => {
    const quantities: Record<string, number> = {};
    if (size) {
      size.forEach(sizeOption => {
        quantities[sizeOption] = selectCartItemQuantity(state, _id, sizeOption);
      });
    }
    return quantities;
  });

  const handleAddToCart = (selectedSize?: string) => {
    // Fixed: Updated to match new CartItem interface
    const data: Omit<CartItem, "quantity" | "originalPrice" | "originalProductId"> = {
      _id: _id,
      title: title,
      category: category,
      mainImage: mainImage,
      price: price,
      size: selectedSize || size?.[0] || ""
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
    <AnimatePresence>
      <motion.div
        ref={cardRef}
        onClick={handleClick}
        className={`${className} mb-[70px] cursor-pointer hover:scale-[1.05] duration-700 transition`}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.5, delay }}
      >
        <div className="w-full flex items-center justify-center">
          <SanityImageComponent
            alt={title}
            image={mainImage || "/placeholder.svg"}
            width={150}
            height={150}
          />
        </div>

        <div className="w-full mt-[38px]">
          <P
            fontFamily="activo"
            className="text-[10px] font-normal uppercase text-[#1E1E1E80] text-center font-activo"
          >
            {category}
          </P>
          <P
            fontFamily="activo"
            className="text-xs md:text-base font-normal uppercase text-[#000] text-center font-activo mt-[8px]"
          >
            {title}
          </P>
          <P
            fontFamily="activo"
            className="text-xs md:text-base font-normal uppercase text-[#000] text-center font-activo mt-[8px]"
          >
            ₦{price.toLocaleString()}
          </P>
        </div>

        <div className="w-full flex flex-col items-center gap-3 justify-center mt-[26px]">
          {!showSizes && (
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                if (!size?.length) {
                  // No sizes, add directly to cart
                  handleAddToCart();
                } else {
                  // Show size selection
                  setShowSizes(true);
                }
              }}
              className={`w-12 cursor-pointer h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                addedToCart === "default" 
                  ? "bg-green-100 border-2 border-green-500" 
                  : "bg-[#F4F4F4] hover:bg-[#E0E0E0]"
              }`}
            >
              {addedToCart === "default" ? (
                <Check size={14} color="#22c55e" />
              ) : (
                <Plus size={14} color="#1E1E1E" />
              )}
            </motion.div>
          )}

          {/* Show cart quantity if item is in cart (for products without sizes) */}
          {!size?.length && cartQuantity > 0 && (
            <P
              fontFamily="activo"
              className="text-xs text-[#68191E] font-medium"
            >
              In cart: {cartQuantity}
            </P>
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
                {size?.map((sizeOption) => {
                  // Use pre-calculated quantity from hook called at component level
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
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProductCard;