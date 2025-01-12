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
    <div className="space-y-15">
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
