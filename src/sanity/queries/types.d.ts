// ----- TypeScript Interfaces -----
/**
 * Represents the main image structure of a product.
 */
interface MainImage {
  _type: "image";
  asset: {
    _ref: string;
    _type: "reference";
  };
  alt?: string;
  caption?: string;
  hotspot?: Record<string, unknown>;
  crop?: Record<string, unknown>;
}

type ProductBase = {
  _id: string;
  title: string;
  slug?: {
    current: string;
  };
  _createdAt?: string;
  category: string;
  price: number;
  availability?: boolean;
  stock?: number;
  mainImage: MainImage;
  description?: string;
};


interface Product extends ProductBase {
  size?: string[];
}



/**
 * Represents a grouped category with its products.
 */
interface CategoryGroup {
  id: number;
  category: string;
  products: Product[];
}
