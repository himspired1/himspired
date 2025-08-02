import { Metadata } from "next";
import ShopPage from "./shop-page";

export const metadata: Metadata = {
  title: "Shop - Men's & Women's Fashion",
  description:
    "Browse our curated collection of thrift, luxury, vintage, and modern fashion for men and women. Find quality clothing at accessible prices.",
  keywords: [
    "shop",
    "fashion",
    "clothing",
    "men's fashion",
    "women's fashion",
    "thrift",
    "luxury",
    "vintage",
  ],
  openGraph: {
    title: "Shop - Men's & Women's Fashion | Himspired",
    description:
      "Browse our curated collection of thrift, luxury, vintage, and modern fashion for men and women.",
    url: "https://himspired.vercel.app/shop",
  },
  twitter: {
    title: "Shop - Men's & Women's Fashion | Himspired",
    description:
      "Browse our curated collection of thrift, luxury, vintage, and modern fashion for men and women.",
  },
};

export default function Shop() {
  return <ShopPage />;
}
