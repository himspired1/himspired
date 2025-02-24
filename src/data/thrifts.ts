// src/data/products.ts
export interface Thrifts {
    id: number;
    image: string;
    type: string;
    name: string;
    price: number;
  }
  
  export const thrifts: Thrifts[] = [
    {
      id: 1,
      image: "/images/suit-ash.svg",
      type: "Electronics",
      name: "Smartphone X1",
      price: 699,
    },
    {
      id: 2,
      image: "/images/trouser.svg",
      type: "Appliances",
      name: "Blender Pro",
      price: 129,
    },
    {
      id: 3,
      image: "/images/suit-blue.svg",
      type: "Fashion",
      name: "Leather Jacket",
      price: 249,
    },
    {
      id: 4,
      image: "/images/suit-red.svg",
      type: "Books",
      name: "Mastering TypeScript",
      price: 39,
    },
  ];
  