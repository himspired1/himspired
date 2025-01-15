"use client"
import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const Fashion = () => {
  const { scrollY } = useScroll();
  const xPosition = useTransform(scrollY, [0, 1000], ["100%", "-250%"]); // Adjust range for scroll effect

  return (
    <div className="h-[150vh] md:h-[175vh] lg:h-[160vh]  xl:h-[190vh] ">
      <div className="sticky top-1/2 -translate-y-1/2 overflow-hidden">
        <motion.h1
          className="text-7xl md:text-40 lg:text-50 xl:text-62.5 font-bold whitespace-nowrap font-moon"
          style={{ x: xPosition }}
        >
          FASHION WITH PURPOSE
        </motion.h1>
      </div>
    </div>
  );
};

export default Fashion;
