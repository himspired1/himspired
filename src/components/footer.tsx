"use client";
import Wrapper from "./layout/Wrapper";
import Link from "next/link";
import { Him, Instagram, Logo_Large, Tiktok } from "../../public/images";
import Image from "next/image";
import { motion } from "framer-motion";
import { useLoading } from "@/context/LoadingContext";
import { useState } from "react";
import TrackOrderModal from "@/components/modals/track-order";
import RefundPolicyModal from "@/components/modals/refund-policy";
import StoreInfoModal from "@/components/modals/store-info";
import DeliveriesModal from "@/components/modals/deliveries";

const Footer = () => {
  const { isLoading } = useLoading();
  const isHomePage =
    typeof window !== "undefined" && window.location.pathname === "/";
  const [isTrackOrderModalOpen, setIsTrackOrderModalOpen] = useState(false);
  const [isRefundPolicyModalOpen, setIsRefundPolicyModalOpen] = useState(false);
  const [isStoreInfoModalOpen, setIsStoreInfoModalOpen] = useState(false);
  const [isDeliveriesModalOpen, setIsDeliveriesModalOpen] = useState(false);

  // Skip animation if not on homepage or if still loading
  const shouldAnimate = !isLoading && isHomePage;

  const handleTrackOrderClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsTrackOrderModalOpen(true);
  };

  const handleRefundPolicyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsRefundPolicyModalOpen(true);
  };

  const handleStoreInfoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsStoreInfoModalOpen(true);
  };

  const handleDeliveriesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDeliveriesModalOpen(true);
  };

  const sections = [
    {
      title: "shop",
      links: [
        { href: "/shop/men", label: "men" },
        { href: "/shop/women", label: "unisex" },
        { href: "#", label: "refund policy", onClick: handleRefundPolicyClick },
      ],
    },
    {
      title: "company",
      links: [
        { href: "/about", label: "about us" },
        { href: "#", label: "stores", onClick: handleStoreInfoClick },
        { href: "/contact", label: "contact us" },
      ],
    },
    {
      title: "support",
      links: [
        { href: "/contact", label: "help" },
        { href: "#", label: "delivery", onClick: handleDeliveriesClick },
        {
          href: "#",
          label: "track your orders",
          onClick: handleTrackOrderClick,
        },
      ],
    },
  ];

  const socialLinks = [
    // { href: "www.x.com", src: Twitter, alt: "twitter" },
    {
      href: "https://www.instagram.com/himspired.ng?igsh=MWV3NHd5ZTFpNThwdA%3D%3D&utm_source=qr",
      src: Instagram,
      alt: "instagram",
    },
    {
      href: "https://www.tiktok.com/@himspired.ng?_t=ZM-8xxDhBrZKqu&_r=1",
      src: Tiktok,
      alt: "tiktok",
    },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 100,
      },
    },
  };

  const logoVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        delay: 0.5,
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <>
      <motion.div
        className="bg-[#68191E] h-fit text-white uppercase"
        initial={shouldAnimate ? "hidden" : "visible"}
        animate="visible"
        variants={containerVariants}
      >
        <Wrapper className="flex flex-col gap-y-15 md:flex-row pt-10">
          <motion.div className="space-y-6" variants={itemVariants}>
            <Image src={Him || "/placeholder.svg"} alt="logo" />
            <p className="text-white-100 font-normal text-sm max-w-56">
              We provide you with quality and premium wears
            </p>
          </motion.div>

          <div className="flex gap-y-10 gap-x-20 flex-wrap">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                className="flex flex-col space-y-6"
                variants={itemVariants}
                custom={index}
              >
                <h1 className="font-normal text-base lg:text-lg text-white-100">
                  {section.title}
                </h1>
                <div className="flex flex-col space-y-4 text-white-100/70">
                  {section.links.map((link, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ x: 5, color: "#ffffff" }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {link.onClick ? (
                        <button
                          onClick={link.onClick}
                          className="text-xs lg:text-sm text-left hover:text-white transition-colors uppercase"
                        >
                          {link.label}
                        </button>
                      ) : (
                        <Link href={link.href} className="text-xs lg:text-sm">
                          {link.label}
                        </Link>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </Wrapper>

        <div className="border-t-[0.4px] border-white/70 mt-15 md:mt-24 mb-12.5"></div>

        <div className="space-y-15 lg:space-y-32.5 pb-2 md:pb-14">
          <Wrapper className="flex-col md:flex-row gap-y-12">
            <motion.div className="flex space-x-5" variants={itemVariants}>
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -5, scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Image
                    src={social.src || "/placeholder.svg"}
                    alt={social.alt}
                  />
                </motion.a>
              ))}
            </motion.div>

            <motion.p
              className="text-white-100/70 text-sm"
              variants={itemVariants}
            >
              all rights reserved - himspire 2025
            </motion.p>
          </Wrapper>

          <motion.div
            className="px-2 md:px-12 w-full flex justify-center"
            variants={logoVariants}
          >
            <Image
              src={Logo_Large || "/placeholder.svg"}
              alt="logo"
              className="w-full"
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Track Order Modal */}
      <TrackOrderModal
        isOpen={isTrackOrderModalOpen}
        onClose={() => setIsTrackOrderModalOpen(false)}
      />

      {/* Refund Policy Modal */}
      <RefundPolicyModal
        isOpen={isRefundPolicyModalOpen}
        onClose={() => setIsRefundPolicyModalOpen(false)}
      />

      {/* Store Info Modal */}
      <StoreInfoModal
        isOpen={isStoreInfoModalOpen}
        onClose={() => setIsStoreInfoModalOpen(false)}
      />

      {/* Deliveries Modal */}
      <DeliveriesModal
        isOpen={isDeliveriesModalOpen}
        onClose={() => setIsDeliveriesModalOpen(false)}
      />
    </>
  );
};

export default Footer;
