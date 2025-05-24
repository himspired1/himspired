"use client";
import { useState } from "react";
import { P } from "@/components/common/typography";

const VisionStatement = () => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="w-full mt-[120px] px-[2em] lg:px-[120px] relative">
      <div className="w-full flex-col flex lg:flex-row items-start justify-between h-full relative">
        <div className="w-full lg:w-[50%] h-full">
          <h1 className="text-[40px] font-moon font-bold">
            Vision <span className="text-grey">Statement</span>
          </h1>
        </div>
        <div className="lg:w-[50%] flex flex-col items-end h-full relative mt-[50px]">
          <P
            className={`text-[#1E1E1E] leading-[23px] text-[18px] font-kiona ${
              !expanded && "lg:h-auto h-[150px] overflow-hidden"
            }`}
          >
            At Himspired, established in 2025, we believe fashion should be both
            expressive and elevated, where thrifted finds meet refined taste.
            Our vision is to create a world where personal style flourishes
            through sustainable choices, and luxury is not about labels but
            about the story each piece carries. We curate a thoughtful mix of
            handpicked, pre-loved treasures and timeless, high-end fashion to
            offer a unique shopping experience rooted in class and
            individuality. At the heart of what we do is a bold belief: luxury
            should be accessible. We are proudly built on the idea of <span className="text-[#68191E] font-bold">affordable
            luxury </span>where you don`t have to break the bank to look and feel
            exceptional. We believe looking luxurious shouldn`t come at a high
            cost. Style, class, and confidence can absolutely come at an
            affordable price. By blending sophistication with thrift, we empower
            our community to embrace fashion that is conscious, creative, and
            distinctly personal. Every item at Himspired reflects our commitment
            to giving fashion a second life, celebrating the charm of the past
            while reimagining it for today. Himspired is more than a brand. It
            is a lifestyle that champions bold expression and intentional
            living. Through each piece, we invite you to redefine what it means
            to be stylish, responsible, and unapologetically inspired.
          </P>

          {/* See More button - only visible on mobile */}
          <button
            className="mt-4 text-[16px] font-semibold text-[#68191E]  lg:hidden border-b-[1px] border-[#68191E] italic"
            onClick={toggleExpand}
          >
            {expanded ? "Read Less" : "Read More"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisionStatement;
