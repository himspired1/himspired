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

  // Calculate items to show based on screen width
  useEffect(() => {
    const updateItemsToShow = () => {
      const width = window.innerWidth;
      if (width >= 1280) setItemsToShow(4); // XL and 2XL
      else if (width >= 1024) setItemsToShow(3); // LG
      else if (width >= 768) setItemsToShow(2); // MD
      else setItemsToShow(1); // SM
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
      // Wait 7 seconds after component mount before starting autoplay
      // This should give the loader enough time to finish
      const initialDelay = setTimeout(() => {
        startAutoplay();
      }, 7000);

      return () => clearTimeout(initialDelay);
    }

    // Start autoplay
    function startAutoplay() {
      if (autoplayRef.current) clearTimeout(autoplayRef.current);

      if (!isHovering) {
        autoplayRef.current = setTimeout(() => {
          // Check if we're at the last slide
          const isLastSlide = current === SECTIONS.length - 1;

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
  const isLastSlide = current === SECTIONS.length - 1;

  return (
    <div
      className="relative py-8 min-h-screen md:py-16 xl:py-20"
      ref={containerRef}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {" "}
      {/* Section indicator - with subtle animation */}
      <div className="px-4 md:px-8 lg:px-16 mb-6 md:mb-8 h-12 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${SECTIONS[current].label.number}-${SECTIONS[current].label.name}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="text-2xl md:text-3xl lg:text-4xl text-left font-bold"
          >
            <span className="text-black ">
              {SECTIONS[current].label.number} /{" "}
            </span>
            <span style={{ color: colors.primary_color }}>
              {SECTIONS[current].label.name}
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
            duration: 50, // Slow down the transition speed (in milliseconds)
          }}
        >
          <CarouselContent>
            {SECTIONS.map((section, index) => (
              <CarouselItem key={section.id} className="w-full">
                <div className="w-full flex items-center justify-center">
                  <div className="w-full max-w-7xl">
                    <ProductSection
                      itemsToShow={itemsToShow}
                      products={section.products}
                      key={`${section.id}-${itemsToShow}`}
                    />
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Custom navigation arrows - disabled when at first/last slide */}
          <div className="absolute top-1/2 -translate-y-1/2 left-2 md:left-4 lg:-left-12">
            <button
              onClick={() => api && api.scrollPrev()}
              className={cn(
                "rounded-full p-3 shadow-lg transition-all duration-300 backdrop-blur-sm group",
                isFirstSlide
                  ? "bg-gray-200/80 cursor-not-allowed"
                  : "bg-white/80 hover:bg-[#68191E]"
              )}
              disabled={isFirstSlide}
              aria-label="Previous section"
            >
              <ChevronLeft
                className={cn(
                  "h-6 w-6 transition-colors duration-300",
                  isFirstSlide
                    ? "text-gray-400"
                    : "text-gray-800 group-hover:text-white"
                )}
              />
            </button>
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 right-2 md:right-4 lg:-right-12">
            <button
              onClick={() => api && api.scrollNext()}
              className={cn(
                "rounded-full p-3 shadow-lg transition-all duration-300 backdrop-blur-sm group",
                isLastSlide
                  ? "bg-gray-200/80 cursor-not-allowed"
                  : "bg-white/80 hover:bg-[#68191E]"
              )}
              disabled={isLastSlide}
              aria-label="Next section"
            >
              <ChevronRight
                className={cn(
                  "h-6 w-6 transition-colors duration-300",
                  isLastSlide
                    ? "text-gray-400"
                    : "text-gray-800 group-hover:text-white"
                )}
              />
            </button>
          </div>
        </Carousel>

        {/* Navigation dots */}
        <div className="flex justify-center gap-2 mt-6 md:mt-8">
          {SECTIONS.map((section, index) => (
            <button
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
              aria-label={`Go to ${section.label.name}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Products;
