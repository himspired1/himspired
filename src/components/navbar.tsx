"use client"
import Link from "next/link"
import { useState } from "react"
import Wrapper from "./layout/Wrapper"
import { Logo } from "../../public/images"
import Image from "next/image"
import { Menu, Search, ShoppingBag } from "lucide-react"
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion"
import { useLoading } from "@/context/LoadingContext"
import { usePathname } from "next/navigation"

const Navbar = () => {
  const [isVisible, setIsVisible] = useState(true)
  const { scrollY } = useScroll()
  const { isLoading } = useLoading()
  const pathname = usePathname()
  const isHomePage = pathname === "/"

  // Skip initial animation if not on homepage or if still loading
  const shouldAnimate = !isLoading && isHomePage

  // Track scroll position and control navbar visibility
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0

    if (latest > previous && latest > 100) {
      setIsVisible(false)
    } else {
      setIsVisible(true)
    }
  })

  const navLinks = [
    { href: "/shop", label: "Shop" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ]

  const utilityLinks = [
    { href: "/cart", label: "Cart" },
    { href: "/search", label: "Search" },
  ]

  // Animation variants
  const navbarVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
        mass: 1,
      },
    },
    exit: {
      y: -100,
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  }

  const linkVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: custom * 0.1,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
    hover: {
      scale: 1.05,
      color: "#68191E",
      transition: { duration: 0.2 },
    },
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-50 bg-white text-gray-850"
          initial={shouldAnimate ? "hidden" : "visible"}
          animate="visible"
          exit="exit"
          variants={navbarVariants}
        >
          <div className="py-3.5">
            <Wrapper className="md:flex hidden items-center">
              <div className="flex xl:space-x-5 uppercase flex-1">
                {navLinks.map((link, index) => (
                  <motion.div key={link.href} custom={index} variants={linkVariants} whileHover="hover">
                    <Link href={link.href} className="px-4">
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </div>

              <motion.div
                className="flex justify-center flex-1"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: {
                    delay: 0.3,
                    type: "spring",
                    stiffness: 200,
                  },
                }}
              >
                <Link href="/">
                  <Image src={Logo || "/placeholder.svg"} alt="Logo" className="h-8 lg:h-10" />
                </Link>
              </motion.div>

              <div className="flex xl:space-x-5 uppercase flex-1 justify-end flex-wrap">
                {utilityLinks.map((link, index) => (
                  <motion.div key={link.href} custom={index} variants={linkVariants} whileHover="hover">
                    <Link href={link.href} className="px-4">
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </Wrapper>

            <Wrapper className="md:hidden items-center">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Menu className="h-6" />
              </motion.div>

              <motion.div
                className="flex justify-center flex-1"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: {
                    delay: 0.2,
                    type: "spring",
                    stiffness: 200,
                  },
                }}
              >
                <Link href="/">
                  <Image src={Logo || "/placeholder.svg"} alt="Logo" className="h-5" />
                </Link>
              </motion.div>

              <div className="flex gap-x-4">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <ShoppingBag className="h-6" />
                </motion.div>

                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Search className="h-6" />
                </motion.div>
              </div>
            </Wrapper>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Navbar
