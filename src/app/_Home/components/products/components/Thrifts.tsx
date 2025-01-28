import { thrifts } from "@/data/thrifts";
import Image from "next/image";
import React from "react";
import clsx from "clsx";
import { Plus } from "lucide-react";
import { div } from "framer-motion/client";

const Thrifts = () => {
  
  return (
  <div className="relative">
   
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7.5 text-center font-activo uppercase">
      {thrifts.map((thrift) => (
        <div
          key={thrift.id}
          className="transition flex flex-col gap-y-2 items-center"
        >
          <Image
            src={thrift.image}
            alt={thrift.name}
            width={0}
            height={0}
            className="w-auto h-auto px-7 py-4.5"
          />
          <div className="flex flex-col gap-y-2.5">
            {" "}
            <p className=" text-gray-850/50 text-xs">{thrift.type}</p>
            <h3 className="text-gray-850 text-base">{thrift.name}</h3>
            <p className="text-gray-850 text-base">NGN {thrift.price}</p>
          </div>
          <button className="mt-1.5 p-4 bg-white-200 w-fit rounded-full">
            {" "}
            <Plus />
          </button>
        </div>
      ))}
    </div>
  </div>
  );
};

export default Thrifts;
