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
            image: suit
        },
        {
            name: "hiMSPIRE OFF-WHITE",
            price: "1,525,000.00",
            category: "T-shirt",
            image: pants
        },
        {
            name: "hiMSPIRE Wine FOrt",
            price: "1,525,000.00",
            category: "Suit",
            image: tuxedo
        },
        {
            name: "himspire jackets",
            price: "1,525,000.00",
            category: "Jackets",
            image: jacket
        },
        {
            name: "V-neck knit",
            price: "1,525,000.00",
            category: "Suit",
            image: knit
        },
    ]
    const [activeTab, setActiveTab] = useState("all")
    return (
        <>
            <div className="w-full min-h-screen mt-[10em]">
                <ShopNavigationBar activeTab={activeTab} setActiveTab={setActiveTab} />

                <div className="w-full mt-[123px] px-[120px]" >
                    <div className="w-full flex items-center justify-between flex-wrap" >
                        {products.map(({ name, price, category, image }) => (
                            <ProductCard title={name} price={price} category={category} image={image} key={name} />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

export default Shop;