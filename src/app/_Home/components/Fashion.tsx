"use client";
import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

const Fashion = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const lastLoggedViewport = useRef(0); // Keep track of the last logged viewport

  gsap.registerPlugin(ScrollTrigger);

  useEffect(() => {
    // Pin and animate horizontal scrolling
    const pin = gsap.fromTo(
      sectionRef.current,
      {
        translateX: 0,
      },
      {
        translateX: "-265vw",
        ease: "none",
        duration: 1,
        scrollTrigger: {
          trigger: triggerRef.current,
          start: "top top",
          end: "2000 top",
          scrub: 0.6,
          pin: true,
          onUpdate: (self) => {
            const scrollPosition = Math.round(self.progress * 300); // 300vw is the total width
            const currentViewport = Math.floor(scrollPosition / 100); // Determine the current 100vw scroll step

            if (currentViewport !== lastLoggedViewport.current) {
              lastLoggedViewport.current = currentViewport;
              console.log(`Scrolled to ${currentViewport * 100}vw`);
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
          className="h-screen w-[260vw] flex flex-row relative items-center justify-center"
        >
          <h1
            className="text-7xl md:text-40 lg:text-50 xl:text-62.5 font-bold whitespace-nowrap font-moon space-x-20 ml-[3em] md:ml-0"
            style={{ wordSpacing: "10rem" }}
          >
            FASHION <span>WITH PURPOSE</span>
          </h1>
        </div>
      </div>
    </section>
  );
};

export default Fashion;
