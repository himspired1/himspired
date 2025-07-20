interface ClothingItem {
  id: string;
  title: string;
  description: string;
  size: string | string[];
  price: number;
  availability: boolean;
  stock: number;
  category: string;
  mainImage: string;
  images?: string[];
  reservedUntil?: string;
  reservedBy?: string;
  reservedQuantity?: number;
}
