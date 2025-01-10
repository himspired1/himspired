import Image from "next/image";
import React from "react";
import { Homepage_Image } from "../../../../public/images";

const Carousel = () => {
  return (
    <div className="space-y-15">
      {" "}
      <Image src={Homepage_Image} alt="carousel" />
     <div className="flex justify-end px-30"> <button className="rounded-25 bg-white-200 py-3 px-6 uppercase">meet the brand</button></div>
    </div>
  );
};

export default Carousel;
