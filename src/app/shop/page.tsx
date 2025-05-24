"use client"
import ShopNavigationBar from "@/components/pages/shop/shop-navigation-bar.component";

import ProductCard from "@/components/product/product-card.component";
import { useState } from "react";
import { useClothesBySpecificCategory } from "@/sanity/queries";
import { P } from "@/components/common/typography";
import { Frown } from "lucide-react";
const Shop = () => {

    const [activeTab, setActiveTab] = useState("all")

    const { clothes, loading, error } = useClothesBySpecificCategory(activeTab);

    console.log("clothes by category:", clothes, loading, error)
    return (
        <>
            <div className="w-full min-h-screen">
                <ShopNavigationBar activeTab={activeTab} setActiveTab={setActiveTab} />

                <div className="w-full mt-[123px] px-[23px] md:px-[30px] lg:px-[120px]" >
                    <div className="w-full flex items-center justify-center gap-4 md:gap-20 flex-wrap" >
                        {clothes.length > 0 && clothes.map((item, index) => (
                            <ProductCard {...item} delay={index * 0.1} key={item?._id} />
                        ))}
                        {clothes.length === 0 && <div className="w-full flex-col items-center justify-center flex-1 flex" >
                            <Frown size={40} color="#68191E" />
                            <P className="mt-5" fontFamily="activo" >No item available</P>
                        </div>}
                    </div>
                </div>
            </div>
        </>
    );
}

export default Shop;