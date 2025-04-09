"use client"
import { ChevronLeft, Plus } from "lucide-react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";

const ProductDetails = () => {
  const [showSizes, setShowSizes] = useState(false);
  const sizes = ["S", "M", "L", "XL", "XXL"];
  const router = useRouter()
  return (
    <motion.div
      className="w-full min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full flex items-center justify-start gap-3 mt-[123px] px-[23px] lg:px-[120px]">
        <ChevronLeft onClick={()=>{
          router.back()
        }} color="#1C1B1F" size={18} className="cursor-pointer" />
        <p onClick={()=>{
          router.back()
        }} className="text-[#000000] text-[14px] font-activo cursor-pointer">Back</p>
      </div>

      <motion.div
        className="w-full mt-[61px] px-[23px] lg:px-[120px] flex flex-col items-center justify-center"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <motion.div
          className="w-auto mx-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Image
            src={"/images/jacket.svg"}
            width={227}
            height={250}
            alt="product-img"
          />
        </motion.div>

        <motion.div
          className="w-full mt-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <p className="font-activo text-[#1E1E1E80] text-[12px] font-normal text-center uppercase">
            Mens suit
          </p>
          <p className="font-activo text-[#1E1E1E] mt-[8px] text-[16px] font-normal text-center uppercase">
            Himspire men’s suit
          </p>
          <p className="font-activo text-[#1E1E1E] mt-[8px] text-[16px] font-normal text-center uppercase">
            ngn 5,000,000.00
          </p>

          <div className=" w-full  md:w-full lg:w-[770px] mx-auto mt-[8px]">
            <p className="font-activo text-[#1E1E1ECC] text-[13px] font-normal text-center uppercase">
              Elevate your style with our complete suit set, expertly tailored
              from premium fabrics for a perfect fit and polished look. This
              set includes a finely crafted blazer, our suit set ensures you
              exude confidence and class wherever you go.
            </p>
          </div>

          <div className="w-full flex items-center justify-center mt-[26px] gap-4">
          {!showSizes &&  <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSizes((prev) => !prev)}
              className="w-[48px] cursor-pointer h-[48px] rounded-full  flex items-center justify-center bg-[#F4F4F4]"
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
                  {sizes.map((size) => (
                    <motion.div
                    onClick={() => setShowSizes((prev) => !prev)}
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
      </motion.div>
    </motion.div>
  );
};

export default ProductDetails;
