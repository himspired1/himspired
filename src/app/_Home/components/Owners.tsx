import React from "react";
import ImageStack from "./ImageStack";
import { ArrowRight } from "lucide-react";
import Wrapper from "@/components/layout/Wrapper";

const Owners = () => {
  return (
    <div className="space-y-6 md:space-y-10 xl:space-y-15 uppercase">
      <Wrapper className="flex flex-col  md:flex-row gap-y-4">
        <h1 className=" text-2xl md:text-3xl xl:text-4xl font-moon">
          Who’s Behind the Style{" "}
          <span className="text-gray-250">Revolution?</span>
        </h1>
        <p className="md:mt-24 max-w-xl ">
          Discover the story, vision, and passion that drive <span className="text-red-800 font-bold">Himspired</span> to
          redefine fashion for a new era.
        </p>
      </Wrapper>
      <ImageStack />
      <div className="flex justify-center md:justify-end md:px-30">
        <button className="flex space-x-3 rounded-25 bg-white-200 py-3 px-6 uppercase">
          <span> meet the brand </span>
          <span>
            <ArrowRight />
          </span>
        </button>
      </div>
    </div>
  );
};

export default Owners;
