"use client";
import { ChevronLeft, Frown, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useClothingItem } from "@/sanity/queries";
import { SanityImageComponent } from "@/components/sanity/image";
import ProductDetailsSkeleton from "@/components/common/skeleton/product-details-skeleton.component";
import { addItem } from "@/redux/slices/cartSlice";
import { useAppDispatch } from "@/redux/hooks";

const ProductDetails = () => {
  const [showSizes, setShowSizes] = useState(false);
  const router = useRouter();
  const params = useParams();
  const dispatch = useAppDispatch();
  const productId = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const { item, loading, error } = useClothingItem(
    typeof productId === "string" ? productId : "",
    "id"
  );
  if (!productId || typeof productId !== "string") {
    return <p className="text-center mt-32 text-sm">Invalid product ID</p>;
  }



  if (loading) {
    return <ProductDetailsSkeleton />;
  }

  if (error) {
    return (
      <p className="text-center mt-32 text-sm text-red-500">
        Error loading product.
      </p>
    );
  }

  if (!item) {
    return (
      <div className="w-full flex flex-1 items-center justify-center flex-col">
        <Frown size={50} color="68191E" />
        <p className="text-center mt-32 text-sm">Product not found.</p>;
      </div>
    );
  }

  return (
    <motion.div
      className="w-full min-h-screen pb-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full flex items-center justify-start gap-3 mt-[123px] px-[23px] lg:px-[120px]">
        <ChevronLeft
          onClick={() => {
            router.back();
          }}
          color="#1C1B1F"
          size={18}
          className="cursor-pointer"
        />
        <p
          onClick={() => {
            router.back();
          }}
          className="text-[#000000] text-sm font-activo cursor-pointer"
        >
          Back
        </p>
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
          <SanityImageComponent
            image={item.mainImage || "/placeholder.svg"}
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
          <p className="font-activo text-[#1E1E1E80] text-xs font-normal text-center uppercase">
            {item?.category}
          </p>
          <p className="font-activo text-[#1E1E1E] mt-2 text-[16px] font-normal text-center uppercase">
            {item?.title}
          </p>
          <p className="font-activo text-[#1E1E1E] mt-2 text-[16px] font-normal text-center uppercase">
            ngn {item?.price}
          </p>

          <div className=" w-full  md:w-full lg:w-[770px] mx-auto mt-2">
            <p className="font-activo text-[#1E1E1ECC] text-[13px] font-normal text-center uppercase">
              {item?.description}
            </p>
          </div>

          <div className="w-full flex items-center justify-center mt-[26px] gap-4">
            {item?.size && (
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSizes((prev) => !prev)}
                className=" w-12 cursor-pointer h-12 rounded-full  flex items-center justify-center bg-[#F4F4F4]"
              >
                <Plus size={14} color="#1E1E1E" />
              </motion.div>
            )}

            <AnimatePresence>
              {showSizes && (
                <motion.div
                  className="flex gap-4"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.4 }}
                >
                  {item?.size?.map((size) => (
                    <motion.div
                      onClick={() => {
                        const cartData = {
                          quantity: 1,
                          ...item,
                          size: size,

                        };
                        dispatch(addItem(cartData));
                        setShowSizes((prev) => !prev);
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
      </motion.div>
    </motion.div>
  );
};

export default ProductDetails;
