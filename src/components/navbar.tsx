import Link from "next/link";
import React from "react";
import Wrapper from "./layout/Wrapper";
import { Logo } from "../../public/images";
import Image from "next/image";

const Navbar = () => {
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
    <Wrapper className="flex justify-between items-center pt-7.5">
      <div className="flex space-x-5 uppercase flex-1">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} className="px-4 py-2.5">
            {link.label}
          </Link>
        ))}
      </div>
      <div className="flex justify-center flex-1">
        <Image src={Logo} alt="Logo" className="h-10" />
      </div>
      <div className="flex space-x-5 uppercase flex-1 justify-end">
        {utilityLinks.map((link) => (
          <Link key={link.href} href={link.href} className="px-4 py-2.5">
            {link.label}
          </Link>
        ))}
      </div>
    </Wrapper>
  );
};

export default Navbar;
