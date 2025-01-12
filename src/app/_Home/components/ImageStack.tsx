import Image from "next/image";
import React from "react";
import {
  Homepage_Image,
  Stack_Image_1,
  Stack_Image_2,
  Stack_Image_3,
  Stack_Image_4,
} from "../../../../public/images";
import { ArrowRight } from "lucide-react";

const ImageStack = () => {
  return (
    <div className="space-y-15 uppercase">
      <div className="flex px-2 md:px-30 gap-x-48">
        <h1 className="text-4xl">
          Who’s Behind the Style{" "}
          <span className="text-gray-250">Revolution?</span>
        </h1>
        <p className="mt-24">
          Discover the story, vision, and passion that drive Himspired to
          redefine fashion for a new era.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-1">
        <div className="md:col-span-2 md:row-span-1">
          <Image
            src={Stack_Image_1}
            alt="imagestack"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="md:col-span-1 md:row-span-1">
          <Image
            src={Stack_Image_2}
            alt="imagestack"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="md:col-span-1 md:row-span-1">
          <Image
            src={Stack_Image_3}
            alt="imagestack"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="md:col-span-2 md:row-span-1">
          <Image
            src={Stack_Image_4}
            alt="imagestack"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

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

export default ImageStack;
