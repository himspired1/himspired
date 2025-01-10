import React from "react";
import Wrapper from "./layout/Wrapper";
import Link from "next/link";
import {
  Him,
  Instagram,
  Logo_Large,
  Tiktok,
  Twitter,
} from "../../public/images";
import Image from "next/image";

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
  const socialLinks = [
    { href: "www.x.com", src: Twitter, alt: "twitter" },
    { href: "www.instagram.com", src: Instagram, alt: "instagram" },
    { href: "www.tiktok.com", src: Tiktok, alt: "tiktok" },
  ];

  return (
    <div className="bg-primary h-fit text-white uppercase">
      <Wrapper className="pt-10  ">
        <div className="space-y-6">
          <Image src={Him} alt="logo" />
          <p className="text-white-100 font-normal text-sm">
            We provide you with quality and premium wears
          </p>
        </div>
        <div className="flex space-x-20">
          {sections.map((section, index) => (
            <div key={index} className="flex flex-col space-y-6">
              <h1 className="font-normal text-lg text-white-100">
                {section.title}
              </h1>
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
      <div className="space-y-32.5 mb-14">
        <Wrapper>
          <div className="flex space-x-5">
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image src={social.src} alt={social.alt} />
              </a>
            ))}
          </div>
          <p className="text-white-100/70 text-sm">
            all rights reserved - himspire 2025
          </p>
        </Wrapper>
        <div className="px-12">
          <Image src={Logo_Large} alt="logo" />
        </div>
      </div>
    </div>
  );
};

export default Footer;
