"use client";

import React, { useState, useEffect } from "react";
import MainSection from "./ScrollSection";

const SECTIONS = ["1 / THRIFTS", "2 / LUXURY", "3 / VINTAGE", "4 / MODERN"];

const Products = () => {
  const [currentSection, setCurrentSection] = useState(SECTIONS[0]);
  const [titleTop, setTitleTop] = useState(128); // Initial `top` value for the title

  useEffect(() => {
    let lastLoggedVW = 0;

    const handleScroll = () => {
      const scrollPositionVW = (window.scrollY / window.innerWidth) * 100;

      if (Math.floor(scrollPositionVW) !== lastLoggedVW) {
        // console.log(`Scrolled: ${Math.floor(scrollPositionVW)}vw`);
        lastLoggedVW = Math.floor(scrollPositionVW);
      }

     
      if (scrollPositionVW >= 130 && scrollPositionVW <= 145) {
        const progress = (scrollPositionVW - 130) / 20; // Normalize 130-150 to 0-1
        setTitleTop(128 - progress * 128); // Linearly interpolate `top` value
      } else if (scrollPositionVW > 145) {
        setTitleTop(-40); // Set top to 0 after crossing 150vw
      } else if (scrollPositionVW < 130) {
        setTitleTop(128); // Reset top to 128 before reaching 130vw
      }

      const sectionIndex = Math.floor((window.scrollY / window.innerHeight) * 1.3);
      setCurrentSection(SECTIONS[Math.min(sectionIndex, SECTIONS.length - 1)]);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative overflow-hidden">
      <h1
        className={`text-4xl fixed left-32 transition-all duration-500`} // Slow down transition
        style={{ top: `${titleTop}px` }} // Dynamic `top` value
      >
        {currentSection}
      </h1>
      <MainSection />
    </div>
  );
};

export default Products;
