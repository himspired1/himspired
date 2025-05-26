"use client";
import { P } from "@/components/common/typography";
import { useAppSelector } from "@/redux/hooks";
import { selectCartItems, selectCartTotal } from "@/redux/slices/cartSlice";
import { motion } from "framer-motion";
import CheckoutItem from "./checkout-item.component";
const CheckoutItems = () => {
  const checkoutItems = useAppSelector(selectCartItems);
  const subTotal = useAppSelector(selectCartTotal);
  return (
    <>
      <div className="w-full py-4 ">
        <div className="w-full">
          <P
            fontFamily="activo"
            className=" text-sm text-left font-semibold lg:text-base uppercase"
          >
            Your items are
          </P>
        </div>

        <div className=" w-full mt-7">
          {checkoutItems.map(
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
                <CheckoutItem
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
        <hr className="w-full h-[0.1px] bg-[#0000004D]" />

        <div className=" w-full flex items-center justify-between mt-6">
          <P
            fontFamily="activo"
            className=" text-[#1E1E1E] font-normal uppercase text-sm lg:text-base"
          >
            Subtotal:
          </P>
          <P
            fontFamily="activo"
            className=" font-semibold text-sm lg:text-base uppercase  text-[#1E1E1E]"
          >
            NGN {subTotal.toLocaleString()}
          </P>
        </div>
      </div>
    </>
  );
};

export default CheckoutItems;
