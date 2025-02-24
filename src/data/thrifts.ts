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
    type: `men’s suit`,
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
];
