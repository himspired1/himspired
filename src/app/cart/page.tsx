"use client";
import { P } from "@/components/common/typography";
import CartItem from "@/components/pages/cart/cart-item.component";
import CartSummary from "@/components/pages/cart/cart-summary.component";
import React from "react";
import { motion } from "framer-motion";
import { selectCartItems } from "@/redux/slices/cartSlice";
import { useAppSelector } from "@/redux/hooks";
const Page = () => {
  const cartItems = useAppSelector(selectCartItems)
  return (
    <div className=" min-h-screen  top-24 relative px-6 md:px-14 pb-52 ">
      <div className="w-full flex items-center justify-between">
        <P fontFamily={"moon"} className=" text-2xl uppercase lg:text-4xl">
          CART
        </P>
        <P
          fontFamily={"activo"}
          className="uppercase text-xs cursor-pointer text-primary font-medium lg:hidden"
        >
          Clear cart
        </P>
      </div>

      <div className="w-full flex flex-col items-start justify-between mt-8 lg:flex-row lg:gap-12 ">
        <div className="w-full lg:w-3/5">
          {cartItems.map(
            ({ title, _id, size, price, quantity, mainImage, category }, index) => (
              <motion.div
                key={_id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <CartItem
                  key={_id}
                  title={title}
                  id={_id}
                  price={price}
                  no_of_item={quantity}
                  image={mainImage}
                  category={category}
                  size={size}
                />
              </motion.div>
            )
          )}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="w-full flex flex-col items-center justify-between mt-8 lg:m-0 lg:w-2/5 "
        >
          <CartSummary />
        </motion.div>
      </div>
    </div>
  );
};

export default Page;
