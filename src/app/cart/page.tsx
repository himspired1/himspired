"use client";
import { P } from "@/components/common/typography";
import CartItem from "@/components/pages/cart/cart-item.component";
import CartSummary from "@/components/pages/cart/cart-summary.component";
import React from "react";
import { motion } from "framer-motion";
import { clearCart, selectCartItems } from "@/redux/slices/cartSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { ShoppingCart } from "lucide-react";
const Page = () => {
  const cartItems = useAppSelector(selectCartItems);
  const dispatch = useAppDispatch();
  return (
    <div className=" h-full pt-[5em] lg:pt-0 relative px-6 md:px-14 lg:pb-52 mb-[2em] lg|:mb-0"> 
      <div className="w-full flex items-center justify-between">
        <P fontFamily={"moon"} className=" text-2xl uppercase lg:text-4xl">
          CART
        </P>
        <div
          onClick={() => {
            dispatch(clearCart());
          }}
        >
          {cartItems.length > 0 && (
            <P
              fontFamily={"activo"}
              className="uppercase text-xs cursor-pointer text-primary font-medium lg:hidden"
            >
              Clear cart
            </P>
          )}
        </div>
      </div>

      <div className="w-full flex flex-col items-start justify-between mt-8 lg:flex-row lg:gap-12 ">
        {cartItems.length > 0 ? (
          <>
            <div className="w-full lg:w-3/5">
              {cartItems.map(
                (
                  { title, _id, size, price, quantity, mainImage, category },
                  index
                ) => (
                  <motion.div
                    key={_id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  >
                    <CartItem
                      key={index}
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
          </>
        ) : (
          <div className="w-full flex-col items-center justify-center flex-1 flex min-h-[40vh]">
            <ShoppingCart size={40} color="#68191E" />
            <P className="mt-5 " fontFamily="activo">
              No item in cart{" "}
            </P>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
