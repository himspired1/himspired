"use client";
import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import Thrifts from "./Thrifts";

const MainSection = () => {
  const sectionRef = useRef(null);
  const triggerRef = useRef(null);

  gsap.registerPlugin(ScrollTrigger);

  useEffect(() => {
    const pin = gsap.fromTo(
      sectionRef.current,
      {
        translateX: 0,
      },
      {
        translateX: "-300vw",
        ease: "none",
        duration: 1,
        scrollTrigger: {
          trigger: triggerRef.current,
          start: "top top",
          end: "2000 top",
          scrub: 0.6,
          pin: true,
        },
      }
    );
    return () => {
      {
        /* A return function for killing the animation on component unmount */
      }
      pin.kill();
    };
  }, []);

  return (
    <section className=" overflow-hidden">
      <div ref={triggerRef}>
        <div
          ref={sectionRef}
          className=" h-screen w-[400vw] flex flex-row relative"
        >
          <div className=" h-screen w-screen flex justify-center items-center bg-red-300">
            <Thrifts />
          </div>
          <div className=" h-screen w-screen flex justify-center items-center bg-red-400">
            <h3>Section 2</h3>
          </div>
          <div className=" h-screen w-screen flex justify-center items-center bg-red-500">
            <h3>Section 3</h3>
          </div>
          <div className=" h-screen w-screen flex justify-center items-center bg-red-600">
            <h3>Section 4</h3>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MainSection;
