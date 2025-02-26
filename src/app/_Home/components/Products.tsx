"use client";

import { useState, useEffect } from "react";
import { motion, useSpring, AnimatePresence } from "framer-motion";
import MainSection from "./ScrollSection";

const SECTIONS = ["1 / THRIFTS", "2 / LUXURY", "3 / VINTAGE", "4 / MODERN"];

const Products = () => {
  const [currentSection, setCurrentSection] = useState(SECTIONS[0]);
  const [opacity, setOpacity] = useState(1);

  const progress = useSpring(0, { stiffness: 100, damping: 30 });

  useEffect(() => {
    const handleScroll = () => {
      const scrollPositionVW = (window.scrollY / window.innerWidth) * 10;
      const maxScrollVW = 14;
      const currentProgress = Math.min(scrollPositionVW / maxScrollVW, 1);

      progress.set(currentProgress);

      if (scrollPositionVW >= 10 && scrollPositionVW <= 14) {
        const fadeProgress = (scrollPositionVW - 10) / 4;
        console.log("sdfg", fadeProgress);
        setOpacity(1 - fadeProgress);
      } else if (scrollPositionVW > 14) {
        setOpacity(0);
      } else {
        setOpacity(1);
      }

      const sectionIndex = Math.floor(
        (window.scrollY / window.innerHeight) * 2.05
      );
      setCurrentSection(SECTIONS[Math.min(sectionIndex, SECTIONS.length - 1)]);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [progress]);


  return (
    <div className="relative overflow-hidden">
      <motion.div
        className="fixed bottom-0 left-0 right-0 h-2 bg-primary origin-left z-50"
        style={{ scaleX: progress, opacity }}
      />
      <AnimatePresence mode="wait">
        <motion.h1
          key={currentSection}
          className="text-4xl fixed left-32 top-32"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{
            duration: 0.5,
            ease: "easeInOut",
            opacity: { duration: 0.4 }, 
            exit: { duration: 0.4 }, 
          }}
        >
          {currentSection}
        </motion.h1>
      </AnimatePresence>
      <MainSection />
    </div>
  );
};

export default Products;
