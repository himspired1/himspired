"use client";
import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import Thrifts from "./products/components/Thrifts";
import Luxury from "./products/components/Luxury";
import Senate from "./products/components/Senate";

const MainSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  let lastLoggedViewport = 0; // Keep track of the last logged viewport

  gsap.registerPlugin(ScrollTrigger);

  useEffect(() => {
    // Pin and animate horizontal scrolling
    const pin = gsap.fromTo(
      sectionRef.current,
      {
        translateX: 0,
      },
      {
        translateX: "-400vw",
        ease: "none",
        duration: 1,
        scrollTrigger: {
          trigger: triggerRef.current,
          start: "top top",
          end: "2000 top",
          scrub: 0.6,
          pin: true,
          onUpdate: (self) => {
            const scrollPosition = Math.round(self.progress * 400); // 300vw is the total width
            const currentViewport = Math.floor(scrollPosition / 100); // Determine the current 100vw scroll step

            if (currentViewport !== lastLoggedViewport) {
              lastLoggedViewport = currentViewport;
              // console.log(`Scrolled to ${currentViewport * 100}vw`);
            }
          },
        },
      }
    );

    return () => {
      pin.kill();
    };
  }, []);

  return (
    <section className="overflow-hidden">
      <div ref={triggerRef}>
        <div
          ref={sectionRef}
          className="h-screen w-[500vw] flex flex-row relative items-center"
        >
          <div className="h-[70vh] relative w-screen flex flex-col justify-center items-center ">
            <Thrifts />
          </div>
          <div className="h-[70vh] w-screen flex justify-center items-center ">
            <Luxury />
          </div>
          <div className="h-[70vh] w-screen flex justify-center items-center ">
            <Senate />
          </div>
          <div className="h-[70vh] w-screen flex justify-center items-center ">
            <Senate />
          </div>
         
        </div>
      </div>
    </section>
  );
};

export default MainSection;
