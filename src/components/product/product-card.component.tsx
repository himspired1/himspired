import Image from "next/image";
import { P } from "../common/typography";
import { Plus } from 'lucide-react';
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch } from "@/redux/hooks";
import { MouseEvent } from "react";
import { addItem } from "@/redux/slices/cartSlice";

interface ProductProps {
  className?: string;
  title: string;
  image: string;
  category: string;
  price: string;
  id: number;
  delay?: number;
  description?: string;
  size?: string;
  availability?: boolean;
}

const ProductCard = ({ 
  title, 
  className = "", 
  category, 
  price, 
  image, 
  id, 
  delay,
  description = "",
  size = "One Size",
  availability = true 
}: ProductProps) => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    const slug = title.toLowerCase().replace(/\s+/g, '-');
    router.push(`/shop/${id}/${slug}`);
  };

  const dispatch = useAppDispatch()
  
  const data = {
    id: id,
    title: title,
    category: category,
    image: image,
    price: parseFloat(price.replace(/,/g, '')) // Convert string price to number
  }

  return (
    <AnimatePresence>
      <motion.div
        onClick={handleClick}
        className={`${className} mb-[70px] cursor-pointer hover:scale-[1.05] duration-700 transition`}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.5, delay }}
      >
        <div className="w-full flex items-center justify-center">
          <Image alt={title} src={image || "/placeholder.svg"} width={150} height={150} />
        </div>
        
        <div className="w-full mt-[38px]">
          <P fontFamily="activo" className="text-[10px] font-normal uppercase text-[#1E1E1E80] text-center font-activo">
            {category}
          </P>
          <P fontFamily="activo" className="text-xs md:text-base font-normal uppercase text-[#000] text-center font-activo mt-[8px]">
            {title}
          </P>
          <P fontFamily="activo" className="text-xs md:text-base font-normal uppercase text-[#000] text-center font-activo mt-[8px]">
            ₦{price}
          </P>
        </div>
        
        <div className="w-full flex flex-col items-center justify-center mt-[26px]">
          <div onClick={(e) => {
            e.stopPropagation();
            dispatch(addItem(data))
          }} className="w-12 cursor-pointer h-12 rounded-full flex items-center justify-center bg-[#F4F4F4]">
            <Plus size={14} color="#1E1E1E" />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProductCard;