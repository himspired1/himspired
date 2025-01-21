"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import Wrapper from "./layout/Wrapper";
import { Logo } from "../../public/images";
import Image from "next/image";
import { Menu, Search, ShoppingBag } from "lucide-react";

const Navbar = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

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
  const navLinks = [
    { href: "/shop", label: "Shop" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  const utilityLinks = [
    { href: "/cart", label: "Cart" },
    { href: "/search", label: "Search" },
  ];

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 bg-white text-gray-850 transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="py-3.5">
        <Wrapper className="md:flex hidden  items-center">
          <div className="flex  xl:space-x-5 uppercase flex-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="px-4">
                {link.label}
              </Link>
            ))}
          </div>
          <Link href="/" className="flex justify-center flex-1">
            <Image src={Logo} alt="Logo" className="h-8 lg:h-10" />
          </Link>
          <div className="flex  xl:space-x-5 uppercase flex-1 justify-end flex-wrap">
            {utilityLinks.map((link) => (
              <Link key={link.href} href={link.href} className="px-4 ">
                {link.label}
              </Link>
            ))}
          </div>
        </Wrapper>
        <Wrapper className=" md:hidden items-center">
          <Menu className="h-6" />
          <Link href="/" className="flex justify-center flex-1">
            <Image src={Logo} alt="Logo" className="h-5" />
          </Link>
          <div className="flex gap-x-4">
            <ShoppingBag className="h-6" />
            <Search className="h-6" />
          </div>
        </Wrapper>
      </div>{" "}
    </div>
  );
};

export default Navbar;
