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

/**
 * Represents a single clothing product fetched from Sanity.
 */
interface Product {
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
  size?: string[];
  mainImage: MainImage;
  description?: string;
}

/**
 * Represents a grouped category with its products.
 */
interface CategoryGroup {
  id: number;
  category: string;
  products: Product[];
}
