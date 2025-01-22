import { thrifts } from "@/data/thrifts";
import Image from "next/image";
import React from "react";

const Thrifts = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {thrifts.map((thrift) => (
        <div
          key={thrift.id}
          className="border p-4 rounded-lg shadow hover:shadow-lg transition"
        >
          <Image
            src={thrift.image}
            alt={thrift.name}
            width={200}
            height={200}
            className="rounded-md"
          />
          <h3 className="text-lg font-semibold mt-2">{thrift.name}</h3>
          <p className="text-gray-500">{thrift.type}</p>
          <p className="text-orange-500 font-bold">${thrift.price}</p>
        </div>
      ))}
    </div>
  );
};

export default Thrifts;
