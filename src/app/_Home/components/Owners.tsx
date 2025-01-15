import React from "react";
import ImageStack from "./ImageStack";
import { ArrowRight } from "lucide-react";

const Owners = () => {
  return (
    <div className="space-y-15 uppercase">
      <div className="flex px-2 md:px-30 ">
        <h1 className="text-4xl">
          Who’s Behind the Style{" "}
          <span className="text-gray-250">Revolution?</span>
        </h1>
        <p className="mt-24 max-w-xl">
          Discover the story, vision, and passion that drive Himspired to
          redefine fashion for a new era.
        </p>
      </div>
      <ImageStack />
      <div className="flex justify-end px-30">
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
