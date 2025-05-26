import { P } from "../common/typography";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch } from "@/redux/hooks";
import { MouseEvent, useEffect, useRef, useState } from "react";
import { addItem, CartItem } from "@/redux/slices/cartSlice";
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
  const cardRef = useRef<HTMLDivElement>(null);
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    router.push(`/shop/${_id}/${slug?.current}`);
  };

  const dispatch = useAppDispatch();
  const data: CartItem = {
    _id: _id,
    title: title,
    category: category,
    mainImage: mainImage,
    price: price,
    quantity: 1,
    size: size?.[0]
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
            ₦{price}
          </P>
        </div>

        <div className="w-full flex flex-col items-center gap-3 justify-center mt-[26px]">
          {!showSizes && <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              if (size?.length === 0) {
                dispatch(addItem(data));
              }
              setShowSizes((prev) => !prev)
            }}
            className="w-12 cursor-pointer h-12 rounded-full flex items-center justify-center bg-[#F4F4F4]"
          >
            <Plus size={14} color="#1E1E1E" />
          </motion.div>}
          <AnimatePresence>
            {showSizes && (
              <motion.div

                className="flex gap-4"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.4 }}
              >
                {size?.map((size) => (
                  <motion.div
                    onClick={(e) => {
                      e.stopPropagation();
                      const cartData = {
                        ...data,
                        size: size
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
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProductCard;
