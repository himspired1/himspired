"use client"
import ShopNavigationBar from "@/components/pages/shop/shop-navigation-bar.component";

import ProductCard from "@/components/product/product-card.component";
import { useState } from "react";
import { shopProducts } from "./shop-data";
const Shop = () => {

    const [activeTab, setActiveTab] = useState("all")
    return (
        <>
            <div className="w-full min-h-screen">
                <ShopNavigationBar activeTab={activeTab} setActiveTab={setActiveTab} />

                <div className="w-full mt-[123px] px-[23px] md:px-[30px] lg:px-[120px]" >
                    <div className="w-full flex items-center justify-between flex-wrap" >
                        {shopProducts.map(({ name, price, category, image, id }, index) => (
                            <ProductCard
                                className="w-[50%] md:w-[25%]"
                                title={name}
                                price={price}
                                category={category}
                                image={image}
                                key={id}
                                id={id}
                                delay={index * 0.1}
                            />
                        ))}

                    </div>
                </div>
            </div>
        </>
    );
}

export default Shop;