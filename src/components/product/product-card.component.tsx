import Image from "next/image";
import { P } from "../common/typography";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface ProductProps {
  className?: string;
  title: string;
  image: string;
  category: string;
  price: string;
  id: number;
  delay?: number;
}

const ProductCard = ({ title, className = "", category, price, image, id, delay }: ProductProps) => {
  const router = useRouter();

  const handleClick = () => {
    const slug = title.toLowerCase().replace(/\s+/g, '-');
    router.push(`/shop/${id}/${slug}`);
  };

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
          <Image alt={title} src={image} width={150} height={150} />
        </div>
        <div className="w-full mt-[38px]">
          <P fontFamily="activo" className="text-[10px] font-normal uppercase text-[#1E1E1E80] text-center font-activo">{category}</P>
          <P fontFamily="activo" className="text-[12px] md:text-[16px] font-normal uppercase text-[#000] text-center font-activo mt-[8px]">{title}</P>
          <P fontFamily="activo" className="text-[12px] md:text-[16px] font-normal uppercase text-[#000] text-center font-activo mt-[8px]">₦{price}</P>
        </div>

        <div className="w-full flex flex-col items-center justify-center mt-[26px]">
          <div className="w-[48px] cursor-pointer h-[48px] rounded-full flex items-center justify-center bg-[#F4F4F4]">
            <Plus size={14} color="#1E1E1E" />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProductCard;
