"use client";
import Link from "next/link";
import React, { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import Wrapper from "./layout/Wrapper";
import { Logo } from "../../public/images";
import Image from "next/image";
import { Menu, ShoppingBag, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppSelector } from "@/redux/hooks";
import { selectCartItems } from "@/redux/slices/cartSlice";

const Navbar = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [cartClickAnimation, setCartClickAnimation] = useState(false);
  const [linkClickAnimations, setLinkClickAnimations] = useState<{
    [key: string]: boolean;
  }>({});
  const cartItems = useAppSelector(selectCartItems);
  const pathname = usePathname();

  // Refs to store timeout IDs for cleanup
  const cartClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const linkClickTimeoutRefs = useRef<{ [key: string]: NodeJS.Timeout | null }>(
    {}
  );

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY]);

  // Close sidebar when clicking outside
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";

      const handleOutsideClick = (e: MouseEvent) => {
        if ((e.target as HTMLElement).classList.contains("sidebar-overlay")) {
          setIsSidebarOpen(false);
        }
      };

      document.addEventListener("click", handleOutsideClick);
      return () => {
        document.removeEventListener("click", handleOutsideClick);
        document.body.style.overflow = "auto";
      };
    }
  }, [isSidebarOpen]);

  // Cleanup timeouts on component unmount
  useEffect(() => {
    const cartTimeout = cartClickTimeoutRef.current;
    const linkTimeouts = linkClickTimeoutRefs.current;

    return () => {
      // Clear cart click timeout
      if (cartTimeout) {
        clearTimeout(cartTimeout);
      }

      // Clear all link click timeouts
      Object.values(linkTimeouts).forEach((timeout) => {
        if (timeout) {
          clearTimeout(timeout);
        }
      });
    };
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Cart click animation handler
  const handleCartClick = () => {
    // Clear any existing timeout
    if (cartClickTimeoutRef.current) {
      clearTimeout(cartClickTimeoutRef.current);
    }

    setCartClickAnimation(true);
    cartClickTimeoutRef.current = setTimeout(
      () => setCartClickAnimation(false),
      300
    );
  };

  // Link click animation handler
  const handleLinkClick = (linkHref: string) => {
    // Clear any existing timeout for this link
    if (linkClickTimeoutRefs.current[linkHref]) {
      clearTimeout(linkClickTimeoutRefs.current[linkHref]!);
    }

    setLinkClickAnimations((prev) => ({ ...prev, [linkHref]: true }));
    linkClickTimeoutRefs.current[linkHref] = setTimeout(() => {
      setLinkClickAnimations((prev) => ({ ...prev, [linkHref]: false }));
    }, 300);
  };

  const navLinks = [
    { href: "/shop", label: "Shop" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  const utilityLinks = [{ href: "/cart", label: "Cart" }];

  // Combine all links for mobile sidebar
  const allLinks = [...navLinks, ...utilityLinks];

  // Check if a link is active
  const isActive = (href: string) => {
    if (href === "/cart") {
      return pathname === "/cart" || pathname.startsWith("/cart/");
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <>
      <div
        className={`fixed top-0 left-0 right-0 z-40 bg-white text-gray-850 transition-transform duration-300 ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="py-3.5">
          <Wrapper className="md:flex hidden items-center">
            <div className="flex xl:space-x-5 uppercase flex-1 text-sm  lg:text-lg">
              {navLinks.map((link) => (
                <div key={link.href} className="relative group">
                  <Link
                    href={link.href}
                    onClick={() => {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (window as any).startPageLoading?.();
                    }}
                    className={`px-4 py-2 transition-colors duration-200 relative block ${
                      isActive(link.href)
                        ? "text-[#68191E] "
                        : "text-gray-850 hover:text-[#68191E]"
                    }`}
                  >
                    {link.label}
                  </Link>

                  {/* Active indicator */}
                  {isActive(link.href) && (
                    <motion.div
                      className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#68191E]"
                      layoutId="activeTab"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}

                  {/* Hover indicator */}
                  {!isActive(link.href) && (
                    <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#68191E] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
                  )}
                </div>
              ))}
            </div>

            <Link href="/" className="flex justify-center flex-1">
              <Image src={Logo} alt="Logo" className="h-8 lg:h-10" />
            </Link>

            <div className="flex xl:space-x-5 uppercase flex-1 justify-end flex-wrap">
              {utilityLinks.map((link) => (
                <div key={link.href} className="relative group">
                  <Link
                    href={link.href}
                    onClick={() => {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (window as any).startPageLoading?.();
                    }}
                    className={`px-4 py-2 transition-colors duration-200 relative block ${
                      isActive(link.href)
                        ? "text-[#68191E]"
                        : "text-gray-850 hover:text-[#68191E]"
                    }`}
                  >
                    {link.label}
                    <div className="w-5 z-10 absolute -top-1 -right-1 h-5 items-center p-2 justify-center flex rounded-full bg-[#68191E]">
                      <p className="text-xs text-white font-medium font-activo">
                        {cartItems.length}
                      </p>
                    </div>
                  </Link>

                  {/* Active indicator */}
                  {isActive(link.href) && (
                    <motion.div
                      className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#68191E]"
                      layoutId="activeTab"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}

                  {/* Hover indicator */}
                  {!isActive(link.href) && (
                    <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#68191E] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
                  )}
                </div>
              ))}
            </div>
          </Wrapper>

          <Wrapper className="md:hidden items-center flex justify-between">
            <motion.button
              onClick={toggleSidebar}
              className="p-2"
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.1 }}
            >
              <Menu className="h-6" />
            </motion.button>
            <Link href="/" className="flex justify-center flex-1">
              <Image src={Logo} alt="Logo" className="h-5" />
            </Link>
            <div className="flex gap-x-4">
              <Link className="relative" href="/cart" onClick={() => { 
                handleCartClick(); 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (window as any).startPageLoading?.(); 
              }}>
                <motion.div
                  animate={
                    cartClickAnimation
                      ? {
                          scale: [1, 0.8, 1.2, 1],
                          rotate: [0, -10, 10, 0],
                        }
                      : {}
                  }
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <ShoppingBag
                    className={`h-6 transition-colors duration-200 ${
                      isActive("/cart") ? "text-[#68191E]" : "text-gray-850"
                    }`}
                  />
                </motion.div>
                <motion.div
                  className="w-5 z-10 absolute -top-2 left-3 h-5 items-center justify-center flex rounded-full bg-[#68191E]"
                  animate={
                    cartClickAnimation
                      ? {
                          scale: [1, 1.3, 1],
                          y: [0, -5, 0],
                        }
                      : {}
                  }
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <motion.p
                    className="text-xs text-white font-medium font-activo"
                    animate={
                      cartClickAnimation
                        ? {
                            scale: [1, 1.2, 1],
                            color: ["#ffffff", "#ffeb3b", "#ffffff"],
                          }
                        : {}
                    }
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    {cartItems.length}
                  </motion.p>
                </motion.div>
              </Link>
            </div>
          </Wrapper>
        </div>
      </div>

      {/* Mobile Sidebar with overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 sidebar-overlay"
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed top-0 left-0 h-full w-4/5 max-w-xs bg-white z-50 shadow-lg rounded-r-[2em]"
            >
              <div className="flex flex-col h-full">
                <div className="flex justify-end p-4 border-b">
                  <motion.button
                    onClick={closeSidebar}
                    className="p-1"
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.1 }}
                  >
                    <X className="h-6 w-6" />
                  </motion.button>
                </div>

                <div className="py-6 px-6 flex flex-col space-y-6">
                  {allLinks.map((link) => (
                    <motion.div
                      key={link.href}
                      animate={
                        linkClickAnimations[link.href]
                          ? {
                              scale: [1, 0.95, 1.05, 1],
                              x: [0, 5, -5, 0],
                            }
                          : {}
                      }
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => {
                          closeSidebar();
                          handleLinkClick(link.href);
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          (window as any).startPageLoading?.();
                        }}
                        className={`text-lg uppercase font-sm transition-colors duration-200 relative ${
                          isActive(link.href)
                            ? "text-[#68191E] font-semibold"
                            : "text-gray-850 hover:text-[#68191E]"
                        }`}
                      >
                        {link.label}
                        {/* Active indicator for mobile */}
                        {isActive(link.href) && (
                          <motion.div
                            className="absolute -left-6 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-[#68191E] rounded-r"
                            layoutId="mobileActiveTab"
                            initial={false}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 30,
                            }}
                          />
                        )}
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
