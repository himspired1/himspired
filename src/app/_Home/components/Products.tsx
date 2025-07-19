"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { colors } from "@/constants/colors";
import ProductSection from "./products/components/ProductSection";
import {
  thriftsProducts,
  luxuryProducts,
  vintageProducts,
  modernProducts,
} from "@/data/products";
import { useClothesByCategory } from "@/sanity/queries";
import React from "react";
import ProductCardSkeleton from "@/components/common/skeleton/product-card-skeleton.component";


// Define our sections with their components and data
const SECTIONS = [
  {
    id: "thrifts",
    label: { number: "1", name: "THRIFTS" },
    products: thriftsProducts,
  },
  {
    id: "luxury",
    label: { number: "2", name: "LUXURY" },
    products: luxuryProducts,
  },
  {
    id: "vintage",
    label: { number: "3", name: "VINTAGE" },
    products: vintageProducts,
  },
  {
    id: "modern",
    label: { number: "4", name: "MODERN" },
    products: modernProducts,
  },
];

const Products = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [itemsToShow, setItemsToShow] = useState(4);
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);
  const autoplayDelay = 5000; // 5 seconds between slides - standard timing
  const initialDelayRef = useRef(false);
  // const { clothes, loading, error, refetch } = useClothes();
  const { clothesByCategory, loading } = useClothesByCategory(8);




  // Calculate items to show based on screen width
  useEffect(() => {
    const updateItemsToShow = () => {
      const width = window.innerWidth;
      if (width >= 1280) setItemsToShow(4); // XL and 2XL
      else if (width >= 768) setItemsToShow(3); // MD
      else setItemsToShow(2); // SM
    };

    // Initial update
    updateItemsToShow();

    // Update on resize
    window.addEventListener("resize", updateItemsToShow);
    return () => window.removeEventListener("resize", updateItemsToShow);
  }, []);

  // Update current index when carousel changes
  useEffect(() => {
    if (!api) return;

    const onChange = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on("select", onChange);
    api.on("reInit", onChange);
    onChange(); // Initial call to set states

    return () => {
      api.off("select", onChange);
      api.off("reInit", onChange);
    };
  }, [api]);

  // Autoplay functionality with delay for loader
  useEffect(() => {
    if (!api) return;

    // Delay initial autoplay to account for loader
    if (!initialDelayRef.current) {
      initialDelayRef.current = true;
      // Wait 1 second after component mount before starting autoplay
      // Since we now have a separate loader, we don't need to wait as long
      const initialDelay = setTimeout(() => {
        startAutoplay();
      }, 1000);

      return () => clearTimeout(initialDelay);
    }

    // Start autoplay
    function startAutoplay() {
      if (autoplayRef.current) clearTimeout(autoplayRef.current);

      if (!isHovering) {
        autoplayRef.current = setTimeout(() => {
          // Check if we're at the last slide
          const isLastSlide = current === clothesByCategory.length - 1;

          if (isLastSlide) {
            // Go back to the first slide
            api?.scrollTo(0);
          } else {
            // Go to the next slide
            api?.scrollNext();
          }
        }, autoplayDelay);
      }
    }

    // Initial start
    startAutoplay();

    // Set up event listeners for autoplay
    api.on("select", startAutoplay);

    // Clean up
    return () => {
      if (autoplayRef.current) clearTimeout(autoplayRef.current);
      api.off("select", startAutoplay);
    };
  }, [api, isHovering, current, autoplayDelay]);

  // Navigate to specific slide when clicking dots
  const goToSlide = (index: number) => {
    if (api) {
      api.scrollTo(index);
    }
  };

  // Check if we're at the first or last slide
  const isFirstSlide = current === 0;
  const isLastSlide = current === clothesByCategory.length - 1;
  if (loading && clothesByCategory.length === 0) {
    return (<div className="w-full flex items-center justify-center gap-4 md:gap-20  overflow-hidden mt-30 mb-10" >
      {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} delay={i * 0.1} />)}
    </div>
    )
  }
  return (
    <div
      className="relative max-w-5xl mx-auto pt-8 md:pt-16 xl:pt-24 pb-24 mt-[5em] lg:mt-0"
      ref={containerRef}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {" "}
      {/* Section indicator - with enhanced animation */}
      <div className=" mb-6 md:mb-8 h-12 overflow-hidden font-moon">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${clothesByCategory[current]?.category}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
              type: "spring",
              stiffness: 100,
              damping: 15,
            }}
            className="text-2xl md:text-3xl lg:text-4xl text-left font-bold"
          >
            <span className="text-black font-moon">
              {current + 1} /{" "}
            </span>
            <span className=" capitalize" style={{ color: colors.primary_color }}>
              {clothesByCategory[current]?.category}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Carousel */}
      <div className="container mx-auto px-4">
        <Carousel
          setApi={setApi}
          className="w-full relative"
          opts={{
            align: "start",
            loop: false,
            duration: 50,
          }}
        >
          <CarouselContent>
            {clothesByCategory.map((section) => (
              <CarouselItem key={section.id} className="w-full">
                <motion.div
                  className="w-full flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-full max-w-7xl">
                    <ProductSection
                      itemsToShow={itemsToShow}
                      products={section?.products}
                      key={`${section.id}-${itemsToShow}`}
                    />
                  </div>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Custom navigation arrows - disabled when at first/last slide */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 left-0 md:left-4 lg:-left-12 hidden md:flex"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <motion.button
              onClick={() => api && api.scrollPrev()}
              className={cn(
                "rounded-full p-3 shadow-lg transition-all duration-300 backdrop-blur-sm group",
                isFirstSlide
                  ? "bg-gray-200/80 cursor-not-allowed"
                  : "bg-white/80 hover:bg-[#68191E]"
              )}
              disabled={isFirstSlide}
              aria-label="Previous section"
              whileHover={!isFirstSlide ? { scale: 1.1 } : undefined}
              whileTap={!isFirstSlide ? { scale: 0.95 } : undefined}
            >
              <ChevronLeft
                className={cn(
                  "h-6 w-6 transition-colors duration-300",
                  isFirstSlide
                    ? "text-gray-400"
                    : "text-gray-800 group-hover:text-white"
                )}
              />
            </motion.button>
          </motion.div>

          <motion.div
            className="absolute top-1/2 -translate-y-1/2 right-0 md:right-4 lg:-right-12 hidden md:flex"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <motion.button
              onClick={() => api && api.scrollNext()}
              className={cn(
                "rounded-full p-3 shadow-lg transition-all duration-300 backdrop-blur-sm group",
                isLastSlide
                  ? "bg-gray-200/80 cursor-not-allowed"
                  : "bg-white/80 hover:bg-[#68191E]"
              )}
              disabled={isLastSlide}
              aria-label="Next section"
              whileHover={!isLastSlide ? { scale: 1.1 } : undefined}
              whileTap={!isLastSlide ? { scale: 0.95 } : undefined}
            >
              <ChevronRight
                className={cn(
                  "h-6 w-6 transition-colors duration-300",
                  isLastSlide
                    ? "text-gray-400"
                    : "text-gray-800 group-hover:text-white"
                )}
              />
            </motion.button>
          </motion.div>
        </Carousel>

        {/* Navigation dots with animation */}
        <motion.div
          className="flex justify-center gap-2 mt-6 md:mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {clothesByCategory.map((section, index) => (
            <motion.button
              key={section.id}
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-300",
                current === index
                  ? "scale-125"
                  : "bg-gray-300 hover:bg-gray-400"
              )}
              style={{
                backgroundColor:
                  current === index ? colors.primary_color : undefined,
              }}
              onClick={() => goToSlide(index)}
              aria-label={`Go to ${section.category}`}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default React.memo(Products);
