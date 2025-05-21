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
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate items to show based on screen width
  useEffect(() => {
    const updateItemsToShow = () => {
      const width = window.innerWidth
      if (width >= 1280)
        setItemsToShow(4) // XL and 2XL
      else if (width >= 1024)
        setItemsToShow(3) // LG
      else if (width >= 768)
        setItemsToShow(3) // MD
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
    return () => {
      api.off("select", onChange)
    }
  }, [api])

  // Navigate to specific slide when clicking dots
  const goToSlide = (index: number) => {
    if (api) {
      api.scrollTo(index)
    }
  }

  return (
    <div className="relative py-16 md:py-24 lg:py-32" ref={containerRef}>
      {/* Section indicator */}
      <AnimatePresence mode="wait">
        <motion.h1
          key={SECTIONS[current].label}
          className="text-2xl md:text-3xl lg:text-4xl text-left px-4 md:px-8 lg:px-16 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{
            duration: 0.5,
            ease: "easeInOut",
          }}
        >
          {SECTIONS[current].label}
        </motion.h1>
      </AnimatePresence>

      {/* Carousel */}
      <div className="container mx-auto px-4">
        <Carousel
          setApi={setApi}
          className="w-full relative"
          opts={{
            align: "start",
            loop: true,
          }}
        >
          <CarouselContent>
            {SECTIONS.map((section, index) => {
              const SectionComponent = section.component
              return (
                <CarouselItem key={section.id} className="w-full">
                  <div className="w-full flex items-center justify-center min-h-[60vh] md:min-h-[70vh]">
                    <div className="w-full max-w-7xl">
                      <SectionComponent itemsToShow={itemsToShow} />
                    </div>
                  </div>
                </CarouselItem>
              )
            })}
          </CarouselContent>

          {/* Custom navigation arrows */}
          <div className="absolute top-1/2 -translate-y-1/2 left-4 md:left-8">
            <button
              onClick={() => api && api.scrollPrev()}
              className="rounded-full bg-white/80 backdrop-blur-sm p-3 shadow-lg hover:bg-white transition-all duration-300"
              aria-label="Previous section"
            >
              <ChevronLeft className="h-6 w-6 text-gray-800" />
            </button>
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 right-4 md:right-8">
            <button
              onClick={() => api && api.scrollNext()}
              className="rounded-full bg-white/80 backdrop-blur-sm p-3 shadow-lg hover:bg-white transition-all duration-300"
              aria-label="Next section"
            >
              <ChevronRight className="h-6 w-6 text-gray-800" />
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
                current === index ? "bg-primary scale-125" : "bg-gray-300 hover:bg-gray-400",
              )}
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
