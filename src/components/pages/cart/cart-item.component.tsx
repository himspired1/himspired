"use client";

import { P } from "@/components/common/typography";
import { Minus, Plus, Trash2 } from "lucide-react";
import { FC, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { useIsMobile } from "@/hooks/useIsMobile";
import { SanityImageComponent } from "@/components/sanity/image";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import {
  removeItemAndReleaseReservation,
  decrementQuantityAndReleaseReservation,
  incrementQuantityAndUpdateReservation,
} from "@/redux/slices/cartSlice";
import { ChevronLeft } from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
import { toast } from "sonner";

interface CartItemProps {
  title: string;
  image: MainImage;
  category: string;
  no_of_item: number;
  size: string;
  price: string | number;
  id: string | number;
}

interface CartIncrementorProps {
  id: string | number;
  no_of_item: number;
}

const CartItem: FC<CartItemProps> = ({
  title,
  category,
  no_of_item,
  size,
  price,
  image,
  id,
}) => {
  const controls = useAnimation();
  const [, setIsDragging] = useState(false);
  const [, setShowDelete] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const isMobile = useIsMobile();
  const cartItem = useAppSelector((state) =>
    state.persistedReducer.cart.items.find((item) => item._id === id)
  );

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x < -100) {
      setShowDelete(true);
      controls.start({ x: -100 });
    } else {
      setShowDelete(false);
      controls.start({ x: 0 });
    }
  };

  const handleRemove = () => {
    dispatch(
      removeItemAndReleaseReservation(id, undefined, {
        onReservationReleased: (productId) => {
          // Try to trigger a stock update for the removed product if a ref/callback is available
          if (window && (window as any)[`fetchStock_${productId}`]) {
            (window as any)[`fetchStock_${productId}`]();
          }
        },
      })
    );
  };

  return (
    <div className="w-full mb-5 relative overflow-hidden">
      {isMobile && (
        <div
          onClick={handleRemove}
          className="absolute top-1 w-[80%] right-2 h-[95%] bg-red-500 flex items-center justify-end pr-5 z-0"
        >
          <Trash2 color="#fff" size={24} />
        </div>
      )}
      <motion.div
        drag={isMobile ? "x" : false}
        dragDirectionLock
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="relative z-10 bg-white rounded-md cursor-grab lg:cursor-default"
        dragConstraints={isMobile ? { left: -150, right: 0 } : undefined}
      >
        <div className="w-full flex items-start justify-between gap-4 pb-10 px-4 pt-4">
          <div className="w-[20%] md:w-[10%]">
            <SanityImageComponent
              width={75}
              height={85}
              image={image}
              alt={title}
              className="w-20 h-20 object-contain"
            />
          </div>

          <div className="w-[80%] md:w-[90%]">
            <div className="w-full flex items-center justify-between">
              <P
                fontFamily={"activo"}
                className="text-sm font-normal uppercase lg:text-base"
              >
                {title}
              </P>
              <div className="flex items-center gap-3">
                <P
                  fontFamily={"activo"}
                  className="text-sm font-semibold uppercase lg:text-base"
                >
                  NGN {price.toLocaleString("us")}
                </P>
                {/* Desktop Remove Button */}
                <button
                  onClick={handleRemove}
                  className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 transition-colors group"
                  title="Remove item"
                >
                  <Trash2
                    size={16}
                    className="text-red-500 group-hover:text-red-600 transition-colors"
                  />
                </button>
              </div>
            </div>

            <div className="w-full mt-3">
              <P
                fontFamily={"activo"}
                className="text-xs text-[#1E1E1E99] uppercase m-0"
              >
                Category: {category}
              </P>
              <P
                fontFamily={"activo"}
                className="text-xs text-[#1E1E1E99] uppercase m-0"
              >
                Item: {no_of_item}
              </P>

              <div className="w-full flex items-center justify-between">
                <P
                  fontFamily={"activo"}
                  className="text-xs text-[#1E1E1E99] uppercase m-0"
                >
                  Size: {size}
                </P>
                <CartIncrementor id={id} no_of_item={no_of_item} />
              </div>

              {/* Stock information */}
              {cartItem && (
                <P
                  fontFamily={"activo"}
                  className="text-xs text-[#1E1E1E99] uppercase m-0"
                >
                  Stock: {cartItem.quantity}/{cartItem.stock} available
                </P>
              )}

              {/* Alternative text remove button for desktop (if you prefer this style) */}
              <div className="md:hidden mt-4 flex items-center justify-end ">
                <span className="text-red-500">
                  <ChevronLeft></ChevronLeft>
                </span>
                <button
                  onClick={handleRemove}
                  className="text-xs font-moon text-red-500 hover:text-red-700 uppercase block md:hidden cursor-pointer transition-colors"
                >
                  Swipe to remove
                </button>
              </div>
            </div>
          </div>
        </div>
        <hr className="w-full h-[0.1px] bg-[#0000004D]" />
      </motion.div>
    </div>
  );
};

export default CartItem;

const CartIncrementor = ({ id, no_of_item }: CartIncrementorProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const cartItem = useAppSelector((state) =>
    state.persistedReducer.cart.items.find((item) => item._id === id)
  );

  const handleIncrement = async () => {
    if (!cartItem) return;

    // Check if we can increase quantity without exceeding stock
    if (cartItem.quantity >= cartItem.stock) {
      toast.error(
        `Cannot add more. Only ${cartItem.stock} available in stock.`
      );
      return;
    }

    dispatch(
      incrementQuantityAndUpdateReservation(id, undefined, {
        onReservationReleased: (productId) => {
          if (window && (window as any)[`fetchStock_${productId}`]) {
            (window as any)[`fetchStock_${productId}`]();
          }
        },
      })
    );
  };

  const handleDecrement = () => {
    dispatch(
      decrementQuantityAndReleaseReservation(id, undefined, {
        onReservationReleased: (productId) => {
          if (window && (window as any)[`fetchStock_${productId}`]) {
            (window as any)[`fetchStock_${productId}`]();
          }
        },
      })
    );
  };

  return (
    <div className="w-auto flex items-center justify-between gap-3">
      <div
        onClick={handleDecrement}
        className="w-7 h-7 rounded-full bg-[#F4F4F4] hover:bg-[#E0E0E0] transition-colors flex items-center justify-center cursor-pointer"
      >
        <Minus color="#000" cursor={"pointer"} size={14} />
      </div>
      <P fontFamily={"activo"} className="text-sm font-semibold">
        {no_of_item}
      </P>
      <div
        onClick={handleIncrement}
        className="w-7 h-7 rounded-full bg-[#F4F4F4] hover:bg-[#E0E0E0] transition-colors flex items-center justify-center cursor-pointer"
      >
        <Plus color="#000" cursor={"pointer"} size={14} />
      </div>
    </div>
  );
};
