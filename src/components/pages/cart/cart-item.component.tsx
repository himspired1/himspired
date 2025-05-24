"use client";

import { P } from "@/components/common/typography";
import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { FC, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { useIsMobile } from "@/hooks/useIsMobile";
import { SanityImageComponent } from "@/components/sanity/image";
import { useDispatch } from "react-redux";
import {
  decrementQuantity,
  incrementQuantity,
  removeItem,
} from "@/redux/slices/cartSlice";

interface CartItemProps {
  title: string;
  image: MainImage;
  category: string;
  no_of_item: number;
  size: string[];
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
  const [isDragging, setIsDragging] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const dispatch = useDispatch();
  const isMobile = useIsMobile();
  const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
    if (info.offset.x < -100) {
      setShowDelete(true);
      controls.start({ x: -100 });
    } else {
      setShowDelete(false);
      controls.start({ x: 0 });
    }
  };

  return (
    <div className="w-full mb-5 relative overflow-hidden">
      {isMobile && (
        <div onClick={() => {
          dispatch(removeItem(id));
        }} className="absolute top-1 w-[80%] right-2 h-[95%]  bg-red-500 flex items-center justify-end pr-5 z-0">
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
              <P
                fontFamily={"activo"}
                className="text-sm font-semibold uppercase lg:text-base"
              >
                NGN {price.toLocaleString("us")}
              </P>
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
                  Size:{" "}
                  {size?.map((size, index) => <span key={index}>{size}</span>)}
                </P>
                <CartIncrementor id={id} no_of_item={no_of_item} />
              </div>
              <div
                onClick={() => {
                  dispatch(removeItem(id));
                }}
              >
                <P
                  fontFamily={"activo"}
                  className="text-xs text-[#1E1E1E99] hidden md:block uppercase m-0 cursor-pointer"
                >
                  Remove
                </P>
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
  const dispatch = useDispatch();
  return (
    <div className="w-auto flex items-center justify-between gap-3">
      <div
        onClick={() => {
          dispatch(decrementQuantity(id));
        }}
        className="w-7 h-7 rounded-full bg-[#F4F4F4]  flex items-center justify-center cursor-pointer"
      >
        <Minus color="#000" cursor={"pointer"} size={14} />
      </div>
      <P fontFamily={"activo"} className=" text-sm font-semibold">
        {no_of_item}
      </P>
      <div
        onClick={() => {
          dispatch(incrementQuantity(id));
        }}
        className="w-7 h-7 rounded-full bg-[#F4F4F4] flex items-center justify-center cursor-pointer"
      >
        <Plus color="#000" cursor={"pointer"} size={14} />
      </div>
    </div>
  );
};
