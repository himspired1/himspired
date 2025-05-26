"use client";
import { motion } from "framer-motion";

const SkeletonBox = ({ className }: { className?: string }) => (
    <div className={`bg-[#E0E0E0] animate-pulse rounded ${className}`} />
);

const ProductDetailsSkeleton = () => {
    return (
        <motion.div
            className="w-full min-h-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="w-full flex items-center justify-start gap-3 mt-[123px] px-[23px] lg:px-[120px]">
                <SkeletonBox className="w-5 h-5 rounded-full" />
                <SkeletonBox className="w-16 h-4" />
            </div>

            <motion.div
                className="w-full mt-[61px] px-[23px] lg:px-[120px] flex flex-col items-center justify-center"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
            >
                <SkeletonBox className="w-[227px] h-[250px] rounded-xl" />

                <motion.div
                    className="w-full mt-8 flex flex-col items-center"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                >
                    <SkeletonBox className="w-24 h-4 mb-2" />
                    <SkeletonBox className="w-48 h-5 mb-2" />
                    <SkeletonBox className="w-32 h-5 mb-4" />
                    <SkeletonBox className="w-[770px] max-w-full h-16 mb-6" />

                    <div className="flex items-center justify-center gap-4 mt-6">
                        <SkeletonBox className="w-12 h-12 rounded-full" />
                    </div>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

export default ProductDetailsSkeleton;
