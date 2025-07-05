"use client";

import { P } from "@/components/common/typography";
import { FC } from "react";
import { motion } from "framer-motion";
import { SanityImageComponent } from "@/components/sanity/image";

interface CheckoutItem {
    title: string;
    image: MainImage;
    category: string;
    no_of_item: number;
    size: string[];
    price: string | number;
    id: string | number;
}
const CheckoutItem: FC<CheckoutItem> = ({
    title,
    category,
    size,
    price,
    image,
}) => {
    return (
        <div className="w-full mb-5 relative overflow-hidden">
            <motion.div className="relative z-10 bg-white rounded-md cursor-grab lg:cursor-default">
                <div className="w-full flex items-start justify-between gap-4 pb-10 px-4 pt-4">
                    <div className="w-[20%] md:w-[10%]">
                        <SanityImageComponent
                            width={75}
                            height={85}
                            image={image}
                            alt={title}
                            className="w-20 h-20 object-contain"
                        />
                    </div>

                    <div className="w-[80%] md:w-[90%]">
                        <div className="w-full flex items-center justify-between">
                            <P
                                fontFamily={"activo"}
                                className="text-sm font-normal uppercase lg:text-base"
                            >
                                {title}
                            </P>
                            <P
                                fontFamily={"activo"}
                                className="text-sm font-semibold uppercase lg:text-base"
                            >
                                NGN {price.toLocaleString("us")}
                            </P>
                        </div>

                        <div className="w-full mt-3">
                            <P
                                fontFamily={"activo"}
                                className="text-xs text-[#1E1E1E99] uppercase m-0"
                            >
                                Category: {category}
                            </P>

                            <div className="w-full flex items-center justify-between">
                                <P
                                    fontFamily={"activo"}
                                    className="text-xs text-[#1E1E1E99] uppercase m-0"
                                >
                                    Size:{" "}
                                   {size}
                                </P>
                            </div>
                        </div>
                    </div>
                </div>
            
            </motion.div>
        </div>
    );
};

export default CheckoutItem;
