import Image from "next/image";
import React from "react";
import {
  Homepage_Image,
  Stack_Image_1,
  Stack_Image_2,
  Stack_Image_3,
  Stack_Image_4,
} from "../../../../public/images";


const ImageStack = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2  md:gap-1 ">
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
          className="w-full max-h-[421px] md:max-h-[1024px] md:h-full object-cover  object-top"
        />
      </div>

      <div className="md:col-span-1 md:row-span-1">
        <Image
          src={Stack_Image_3}
          alt="imagestack"
          className="w-full max-h-[421px] md:max-h-[1024px] md:h-full object-cover  object-top"
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
  );
};

export default ImageStack;
