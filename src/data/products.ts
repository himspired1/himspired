// src/data/products.ts
export interface Product {
    id: number
    image: string
    type: string
    name: string
    price: number
  }
  
  // Thrifts products
  export const thriftsProducts: Product[] = [
    {
      id: 1,
      image: "/images/suit-ash.svg",
      type: "suit",
      name: "himspire mens suit",
      price: 1525000.0,
    },
    {
      id: 2,
      image: "/images/trouser.svg",
      type: "t-shirt",
      name: "himspire off-white",
      price: 25000.0,
    },
    {
      id: 3,
      image: "/images/suit-blue.svg",
      type: `men's suit`,
      name: "himspire classic",
      price: 25000.0,
    },
    {
      id: 4,
      image: "/images/suit-red.svg",
      type: "suit",
      name: "himspire wine fort",
      price: 2500000.0,
    },
  ]
  
  // Luxury products
  export const luxuryProducts: Product[] = [
    {
      id: 5,
      image: "/images/suit-red.svg",
      type: "luxury suit",
      name: "himspire premium",
      price: 3500000.0,
    },
    {
      id: 6,
      image: "/images/suit-blue.svg",
      type: "designer wear",
      name: "himspire signature",
      price: 4250000.0,
    },
    {
      id: 7,
      image: "/images/suit-ash.svg",
      type: "premium suit",
      name: "himspire executive",
      price: 3750000.0,
    },
    {
      id: 8,
      image: "/images/trouser.svg",
      type: "luxury pants",
      name: "himspire elite",
      price: 1850000.0,
    },
  ]
  
  // Vintage products
  export const vintageProducts: Product[] = [
    {
      id: 9,
      image: "/images/trouser.svg",
      type: "vintage pants",
      name: "himspire retro",
      price: 1250000.0,
    },
    {
      id: 10,
      image: "/images/suit-blue.svg",
      type: "classic suit",
      name: "himspire heritage",
      price: 2150000.0,
    },
    {
      id: 11,
      image: "/images/suit-red.svg",
      type: "vintage wear",
      name: "himspire timeless",
      price: 1950000.0,
    },
    {
      id: 12,
      image: "/images/suit-ash.svg",
      type: "retro suit",
      name: "himspire classic",
      price: 2250000.0,
    },
  ]
  
  // Modern products
  export const modernProducts: Product[] = [
    {
      id: 13,
      image: "/images/suit-ash.svg",
      type: "modern suit",
      name: "himspire contemporary",
      price: 2750000.0,
    },
    {
      id: 14,
      image: "/images/suit-red.svg",
      type: "trendy wear",
      name: "himspire urban",
      price: 2350000.0,
    },
    {
      id: 15,
      image: "/images/trouser.svg",
      type: "fashion forward",
      name: "himspire edge",
      price: 1650000.0,
    },
    {
      id: 16,
      image: "/images/suit-blue.svg",
      type: "modern classic",
      name: "himspire fusion",
      price: 2850000.0,
    },
  ]
  
  // Legacy export for backward compatibility
  export const thrifts = thriftsProducts
  