import Image from "next/image";
import React from "react";
import { Homepage_Image } from "../../../../public/images";
import { ArrowRight } from "lucide-react";

const Carousel = () => {
  return (
    <div className="space-y-15">
      {" "}
      <Image src={Homepage_Image} alt="carousel" />
      <div className="flex justify-end px-30">
        {" "}
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

export default Carousel;
