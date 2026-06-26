"use client";
import ShopNavigationBar from "@/components/pages/shop/shop-navigation-bar.component";
import ProductCard from "@/components/product/product-card.component";
import { useState } from "react";
import { useClothesBySpecificCategory } from "@/sanity/queries";
import { P } from "@/components/common/typography";
import { Frown, Network } from "lucide-react";
import ProductCardSkeleton from "@/components/common/skeleton/product-card-skeleton.component";

const ShopPage = () => {
  const [activeTab, setActiveTab] = useState("all");

  const { clothes, loading, error } = useClothesBySpecificCategory(activeTab);

  return (
    <>
      <div className="w-full min-h-screen lg:mt-[10em]">
        <ShopNavigationBar activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="w-full mt-[123px] px-[23px] md:px-[30px] lg:px-[120px]">
          <div className="w-full flex items-center justify-center gap-4 md:gap-20 flex-wrap">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} delay={i * 0.1} />
                ))
              : clothes.map((item, index) => (
                  <ProductCard {...item} delay={index * 0.1} key={item?._id} />
                ))}

            {!loading && clothes.length === 0 && (
              <div className="w-full flex-col items-center justify-center flex-1 flex">
                <Frown size={40} color="#68191E" />
                <P className="mt-5" fontFamily="activo">
                  No item available
                </P>
              </div>
            )}
            {!loading && error && (
              <div className="w-full flex-col items-center justify-center flex-1 flex">
                <Network size={40} color="#68191E" />
                <P className="mt-5 text-[#68191E]" fontFamily="activo">
                  {error?.message || "Something went wrong"}{" "}
                </P>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ShopPage;
