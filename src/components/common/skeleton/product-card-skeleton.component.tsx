"use client";
import { motion } from "framer-motion";

const SkeletonBox = ({ className = "" }: { className?: string }) => (
    <div className={`bg-[#E0E0E0] animate-pulse rounded ${className}`} />
);

const ProductCardSkeleton = ({
    className = "",
    delay = 0,
}: {
    className?: string;
    delay?: number;
}) => {
    return (
        <motion.div
            className={`${className} mb-[70px] transition`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.5, delay }}
        >
            <div className="w-full flex items-center justify-center">
                <SkeletonBox className="w-[120px] h-[120px] md:w-[150px] md:h-[150px] rounded-xl" />
            </div>
            <div className="w-full mt-[30px] md:mt-[38px] flex flex-col items-center gap-2">
                <SkeletonBox className="w-12 md:w-16 h-3" />
                <SkeletonBox className="w-24 md:w-32 h-4" />
                <SkeletonBox className="w-20 md:w-24 h-4" />
            </div>
            <div className="w-full flex flex-col items-center justify-center gap-3 mt-[20px] md:mt-[26px]">
                <SkeletonBox className="w-10 h-10 md:w-12 md:h-12 rounded-full" />
            </div>
        </motion.div>
    );
};

export default ProductCardSkeleton;
