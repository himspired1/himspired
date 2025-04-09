"use client"
import ShopNavigationBar from "@/components/pages/shop/shop-navigation-bar.component";
import suit from "../../../public/images/suit.svg"
import jacket from "../../../public/images/jacket.svg"
import knit from "../../../public/images/knit-shirt.svg"
import tuxedo from "../../../public/images/tuxedo.svg"
import pants from "../../../public/images/pants.svg"
import ProductCard from "@/components/product/product-card.component";
import { useState } from "react";
const Shop = () => {
    const products = [
        {
            name: "himspire mens suit",
            price: "1,525,000.00",
            category: "Suit",
            image: suit,
            id: 1
        },
        {
            name: "hiMSPIRE OFF-WHITE",
            price: "1,525,000.00",
            category: "T-shirt",
            image: pants,
            id: 2
        },
        {
            name: "hiMSPIRE Wine FOrt",
            price: "1,525,000.00",
            category: "Suit",
            image: tuxedo,
            id: 3
        },
        {
            name: "himspire jackets",
            price: "1,525,000.00",
            category: "Jackets",
            image: jacket,
            id: 4
        },
        {
            name: "V-neck knit",
            price: "1,525,000.00",
            category: "Suit",
            image: knit,
            id: 5
        },
    ]
    const [activeTab, setActiveTab] = useState("all")
    return (
        <>
            <div className="w-full min-h-screen">
                <ShopNavigationBar activeTab={activeTab} setActiveTab={setActiveTab} />

                <div className="w-full mt-[123px] px-[23px] md:px-[30px] lg:px-[120px]" >
                    <div className="w-full flex items-center justify-between flex-wrap" >
                        {products.map(({ name, price, category, image, id }, index) => (
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