import React from "react";
import Wrapper from "./layout/Wrapper";
import Link from "next/link";

const Footer = () => {
  const sections = [
    {
      title: "shop",
      links: [
        { href: "/shop/men", label: "men" },
        { href: "/shop/women", label: "women" },
        { href: "/shop/kids", label: "kids" },
      ],
    },
    {
      title: "company",
      links: [
        { href: "/aboutus", label: "about us" },
        { href: "/stores", label: "stores" },
        { href: "/contactus", label: "contact us" },
      ],
    },
    {
      title: "support",
      links: [
        { href: "/help", label: "help" },
        { href: "/delivery", label: "delivery" },
        { href: "/return&refunds", label: "return & refunds" },
        { href: "/track", label: "track your orders" },
      ],
    },
  ];

  return (
    <div className="bg-primary h-[60vh] text-white">
      <Wrapper className="flex justify-between pt-10 uppercase ">
        <div className="space-y-6">
          <h1>HIM</h1>
          <p className="text-white-100 font-normal text-sm">
            We provide you with quality and premium wears
          </p>
        </div>
        <div className="flex space-x-20">
          {sections.map((section, index) => (
            <div key={index} className="flex flex-col space-y-6">
              <h1 className="font-normal text-lg text-white-100">{section.title}</h1>
              <div className="flex flex-col space-y-4 text-white-100/70">
                {section.links.map((link, idx) => (
                  <Link key={idx} href={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Wrapper>
      <div className="border-t-[0.4px] border-white/70 mt-24 mb-12.5"></div>
    </div>
  );
};

export default Footer;
