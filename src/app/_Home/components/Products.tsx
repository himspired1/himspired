"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Thrifts from "./products/components/Thrifts"
import Luxury from "./products/components/Luxury"
import Senate from "./products/components/Senate"
import Vintage from "./products/components/Vintage"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { colors } from "@/constants/colors"

// Define our sections with their components
const SECTIONS = [
  { id: "thrifts", label: "1 / THRIFTS", component: Thrifts },
  { id: "luxury", label: "2 / LUXURY", component: Luxury },
  { id: "vintage", label: "3 / VINTAGE", component: Vintage },
  { id: "modern", label: "4 / MODERN", component: Senate },
]

const Products = () => {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [itemsToShow, setItemsToShow] = useState(4)
  const [isHovering, setIsHovering] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const autoplayRef = useRef<NodeJS.Timeout | null>(null)
  const autoplayDelay = 5000 // 5 seconds between slides - standard timing
  const initialDelayRef = useRef(false)

  // Calculate items to show based on screen width
  useEffect(() => {
    const updateItemsToShow = () => {
      const width = window.innerWidth
      if (width >= 1280)
        setItemsToShow(4) // XL and 2XL
      else if (width >= 1024)
        setItemsToShow(3) // LG
      else if (width >= 768)
        setItemsToShow(2) // MD
      else setItemsToShow(1) // SM
    }

    // Initial update
    updateItemsToShow()

    // Update on resize
    window.addEventListener("resize", updateItemsToShow)
    return () => window.removeEventListener("resize", updateItemsToShow)
  }, [])

  // Update current index when carousel changes
  useEffect(() => {
    if (!api) return

    const onChange = () => {
      setCurrent(api.selectedScrollSnap())
    }

    api.on("select", onChange)
    api.on("reInit", onChange)
    onChange() // Initial call to set states

    return () => {
      api.off("select", onChange)
      api.off("reInit", onChange)
    }
  }, [api])

  // Autoplay functionality with delay for loader
  useEffect(() => {
    if (!api) return

    // Delay initial autoplay to account for loader
    if (!initialDelayRef.current) {
      initialDelayRef.current = true
      // Wait 7 seconds after component mount before starting autoplay
      // This should give the loader enough time to finish
      const initialDelay = setTimeout(() => {
        startAutoplay()
      }, 7000)

      return () => clearTimeout(initialDelay)
    }

    // Start autoplay
    function startAutoplay() {
      if (autoplayRef.current) clearTimeout(autoplayRef.current)

      if (!isHovering) {
        autoplayRef.current = setTimeout(() => {
          // Check if we're at the last slide
          const isLastSlide = current === SECTIONS.length - 1

          if (isLastSlide) {
            // Go back to the first slide
            api?.scrollTo(0)
          } else {
            // Go to the next slide
            api?.scrollNext()
          }
        }, autoplayDelay)
      }
    }

    // Initial start
    startAutoplay()

    // Set up event listeners for autoplay
    api.on("select", startAutoplay)

    // Clean up
    return () => {
      if (autoplayRef.current) clearTimeout(autoplayRef.current)
      api.off("select", startAutoplay)
    }
  }, [api, isHovering, current, autoplayDelay])

  // Navigate to specific slide when clicking dots
  const goToSlide = (index: number) => {
    if (api) {
      api.scrollTo(index)
    }
  }

  return (
    <div
      className="relative py-16 md:py-24 lg:py-32"
      ref={containerRef}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Section indicator - with subtle animation */}
      <div className="px-4 md:px-8 lg:px-16 mb-12 h-12 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={SECTIONS[current].label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="text-2xl md:text-3xl lg:text-4xl text-left"
          >
            {SECTIONS[current].label}
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
            {SECTIONS.map((section, index) => {
              const SectionComponent = section.component
              return (
                <CarouselItem key={section.id} className="w-full">
                  <AnimatePresence mode="wait">
                    {current === index && (
                      <motion.div
                        key={section.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="w-full flex items-center justify-center min-h-[60vh] md:min-h-[70vh]"
                      >
                        <div className="w-full max-w-7xl">
                          <SectionComponent itemsToShow={itemsToShow} key={`${section.id}-${itemsToShow}`} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CarouselItem>
              )
            })}
          </CarouselContent>

          {/* Custom navigation arrows */}
          <div className="absolute top-1/2 -translate-y-1/2 left-2 md:left-4 lg:-left-12">
            <button
              onClick={() => api && api.scrollPrev()}
              className="rounded-full p-3 shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm hover:bg-primary group"
              aria-label="Previous section"
            >
              <ChevronLeft className="h-6 w-6 text-gray-800 transition-colors duration-300 group-hover:text-white" />
            </button>
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 right-2 md:right-4 lg:-right-12">
            <button
              onClick={() => api && api.scrollNext()}
              className="rounded-full p-3 shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm hover:bg-primary group"
              aria-label="Next section"
            >
              <ChevronRight className="h-6 w-6 text-gray-800 transition-colors duration-300 group-hover:text-white" />
            </button>
          </div>
        </Carousel>

        {/* Navigation dots */}
        <div className="flex justify-center gap-2 mt-8">
          {SECTIONS.map((section, index) => (
            <button
              key={section.id}
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-300",
                current === index ? "scale-125" : "bg-gray-300 hover:bg-gray-400",
              )}
              style={{
                backgroundColor: current === index ? colors.primary_color : undefined,
              }}
              onClick={() => goToSlide(index)}
              aria-label={`Go to ${section.label}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Products
