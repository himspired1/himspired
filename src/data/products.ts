// src/data/products.ts
export interface Product {
    id: number
    image: string
    type: string
    name: string
    price: number
  }
  
  // Polos products
  export const polosProducts: Product[] = [
    {
      id: 1,
      image: "/images/knit-shirt.svg",
      type: "polo",
      name: "himspire classic polo",
      price: 25000.0,
    },
    {
      id: 2,
      image: "/images/knit-shirt.svg",
      type: "polo",
      name: "himspire cotton polo",
      price: 30000.0,
    },
    {
      id: 3,
      image: "/images/knit-shirt.svg",
      type: "polo",
      name: "himspire premium polo",
      price: 35000.0,
    },
    {
      id: 4,
      image: "/images/knit-shirt.svg",
      type: "polo",
      name: "himspire stripe polo",
      price: 28000.0,
    },
  ]
  
  // T-Shirts products
  export const tshirtsProducts: Product[] = [
    {
      id: 5,
      image: "/images/knit-shirt.svg",
      type: "t-shirt",
      name: "himspire basic tee",
      price: 15000.0,
    },
    {
      id: 6,
      image: "/images/knit-shirt.svg",
      type: "t-shirt",
      name: "himspire logo tee",
      price: 20000.0,
    },
    {
      id: 7,
      image: "/images/knit-shirt.svg",
      type: "t-shirt",
      name: "himspire vintage tee",
      price: 22000.0,
    },
    {
      id: 8,
      image: "/images/knit-shirt.svg",
      type: "t-shirt",
      name: "himspire graphic tee",
      price: 18000.0,
    },
  ]
  
  // Jeans products
  export const jeansProducts: Product[] = [
    {
      id: 9,
      image: "/images/pants.svg",
      type: "jeans",
      name: "himspire slim fit",
      price: 45000.0,
    },
    {
      id: 10,
      image: "/images/pants.svg",
      type: "jeans",
      name: "himspire straight cut",
      price: 40000.0,
    },
    {
      id: 11,
      image: "/images/pants.svg",
      type: "jeans",
      name: "himspire distressed",
      price: 50000.0,
    },
    {
      id: 12,
      image: "/images/pants.svg",
      type: "jeans",
      name: "himspire bootcut",
      price: 42000.0,
    },
  ]
  
  // Shirts products
  export const shirtsProducts: Product[] = [
    {
      id: 13,
      image: "/images/suit.svg",
      type: "shirt",
      name: "himspire dress shirt",
      price: 35000.0,
    },
    {
      id: 14,
      image: "/images/suit.svg",
      type: "shirt",
      name: "himspire casual shirt",
      price: 28000.0,
    },
    {
      id: 15,
      image: "/images/suit.svg",
      type: "shirt",
      name: "himspire flannel shirt",
      price: 32000.0,
    },
    {
      id: 16,
      image: "/images/suit.svg",
      type: "shirt",
      name: "himspire oxford shirt",
      price: 30000.0,
    },
  ]
  
  // Legacy exports for backward compatibility
  export const thriftsProducts = polosProducts
  export const luxuryProducts = tshirtsProducts
  export const vintageProducts = jeansProducts
  export const modernProducts = shirtsProducts
  export const thrifts = polosProducts
  