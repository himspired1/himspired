// queries.ts - Updated to match your schema
export const ClothQueryPath = `*[
    _type == "clothingItem"
    && defined(slug.current)
  ]|order(_createdAt desc)[0...12]{_id, title, slug, _createdAt, category, price, availability, stock, mainImage, size}`;

import { SanityDocument } from "next-sanity";
import { client } from "../client";
import { useState, useEffect, useCallback } from "react";

const options = { next: { revalidate: 30 } };

// Server-side function (for use in Server Components or API routes)
export const getClothes = async () => {
  try {
    const clothes = await client.fetch<SanityDocument[]>(
      ClothQueryPath,
      {},
      options
    );
    return { clothes, error: null };
  } catch (error) {
    console.error("Error occurred while fetching clothes", error);
    return { clothes: [], error: error as Error };
  }
};

// Client-side hook (for use in Client Components)
export const useClothes = () => {
  const [clothes, setClothes] = useState<SanityDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchClothes = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await client.fetch<SanityDocument[]>(ClothQueryPath);
      setClothes(result);
    } catch (err) {
      console.error("Error occurred while fetching clothes", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClothes();
  }, []);

  return { clothes, loading, error, refetch: fetchClothes };
};

// Hook to get clothes organized by categories
export const useClothesByCategory = (limit = 12) => {
  // State for array of category objects: { id, category, products }
  const [clothesByCategory, setClothesByCategory] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // GROQ query: fetch all clothing items with defined category and slug
  const clothesQuery = `*[_type == "clothingItem" && defined(category) && defined(slug.current)] | order(_createdAt desc) {
    _id,
    title,
    slug,
    _createdAt,
    category,
    price,
    availability,
    stock,
    size,
    mainImage{
      asset->{ _id, url },
      alt,
      caption,
      hotspot,
      crop
    }
  }`;

  const fetchClothesByCategory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Tell client.fetch to return typed Product[] instead of SanityDocument[]
      const allClothes = await client.fetch<Product[]>(clothesQuery);

      // Derive unique categories in order of first appearance
      const uniqueCategories = Array.from(
        new Set(allClothes.map((item) => item.category))
      );

      // Build array of { id, category, products }
      const groupedArray: CategoryGroup[] = uniqueCategories.map((category, index) => ({
        id: index,
        category,
        products: allClothes
          .filter((item) => item.category === category)
          .slice(0, limit),
      }));

      setClothesByCategory(groupedArray);
    } catch (err) {
      console.error("Error fetching clothes by category:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchClothesByCategory();
  }, [fetchClothesByCategory]);

  return {
    clothesByCategory,
    loading,
    error,
    refetch: fetchClothesByCategory,
  };
};

// Hook to get clothes from a specific category
export const useClothesBySpecificCategory = (category: string, limit = 12) => {
  const [clothes, setClothes] = useState<SanityDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const categoryQuery = `*[
    _type == "clothingItem" 
    && category == $category 
    && defined(slug.current)
  ] | order(_createdAt desc)[0...${limit}] {
    _id,
    title,
    slug,
    _createdAt,
    category,
    price,
    availability,
    stock,
    size,
    description,
    mainImage{
      asset->{
        _id,
        url
      },
      alt,
      caption,
      hotspot,
      crop
    }
  }`;

  const fetchClothes = async () => {
    if (!category) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await client.fetch<SanityDocument[]>(categoryQuery, {
        category,
      });
      setClothes(result);
    } catch (err) {
      console.error(
        `Error occurred while fetching clothes for category: ${category}`,
        err
      );
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClothes();
  }, [category, limit]);

  return { clothes, loading, error, refetch: fetchClothes };
};

// Hook to get all available categories
export const useCategories = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const categoriesQuery = `*[_type == "clothingItem" && defined(category)].category | order(@) | unique()`;

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await client.fetch<string[]>(categoriesQuery);
      setCategories(result.filter(Boolean));
    } catch (err) {
      console.error("Error occurred while fetching categories", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return { categories, loading, error, refetch: fetchCategories };
};

// Advanced hook with filtering options (updated for your schema)
export const useClothesWithFilters = (
  filters: {
    category?: string;
    availability?: boolean;
    minPrice?: number;
    maxPrice?: number;
    size?: string;
    inStock?: boolean;
    limit?: number;
  } = {}
) => {
  const [clothes, setClothes] = useState<SanityDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const buildFilterQuery = () => {
    const conditions = ['_type == "clothingItem"', "defined(slug.current)"];
    const params: Record<string, any> = {};

    if (filters.category) {
      conditions.push("category == $category");
      params.category = filters.category;
    }

    if (filters.availability !== undefined) {
      conditions.push("availability == $availability");
      params.availability = filters.availability;
    }

    if (filters.size) {
      conditions.push("$size in size");
      params.size = filters.size;
    }

    if (filters.minPrice !== undefined) {
      conditions.push("price >= $minPrice");
      params.minPrice = filters.minPrice;
    }

    if (filters.maxPrice !== undefined) {
      conditions.push("price <= $maxPrice");
      params.maxPrice = filters.maxPrice;
    }

    if (filters.inStock) {
      conditions.push("stock > 0");
    }

    const limit = filters.limit || 20;

    return {
      query: `*[${conditions.join(" && ")}] | order(_createdAt desc)[0...${limit}] {
        _id,
        title,
        slug,
        _createdAt,
        category,
        price,
        availability,
        stock,
        size,
        description,
        mainImage{
          asset->{
            _id,
            url
          },
          alt,
          caption,
          hotspot,
          crop
        }
      }`,
      params,
    };
  };

  const fetchClothes = async () => {
    try {
      setLoading(true);
      setError(null);
      const { query, params } = buildFilterQuery();
      const result = await client.fetch<SanityDocument[]>(query, params);
      setClothes(result);
    } catch (err) {
      console.error("Error occurred while fetching filtered clothes", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClothes();
  }, [JSON.stringify(filters)]);

  return { clothes, loading, error, refetch: fetchClothes };
};

// Hook to get a single clothing item by slug or ID
export const useClothingItem = (
  identifier: string,
  type: "slug" | "id" = "slug"
) => {
  const [item, setItem] = useState<SanityDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const singleItemQuery =
    type === "slug"
      ? `*[_type == "clothingItem" && slug.current == $slug][0]{
        _id, 
        title, 
        slug, 
        _createdAt,
        description,
        price,
        availability,
        stock,
        size,
        images[]{
          asset->{
            _id,
            url
          },
          alt,
          caption,
          hotspot,
          crop
        },
        mainImage{
          asset->{
            _id,
            url
          },
          alt,
          caption,
          hotspot,
          crop
        },
        category
      }`
      : `*[_type == "clothingItem" && _id == $id][0]{
        _id, 
        title, 
        slug, 
        _createdAt,
        description,
        price,
        availability,
        stock,
        size,
        images[]{
          asset->{
            _id,
            url
          },
          alt,
          caption,
          hotspot,
          crop
        },
        mainImage{
          asset->{
            _id,
            url
          },
          alt,
          caption,
          hotspot,
          crop
        },
        category
      }`;

  const fetchItem = async () => {
    if (!identifier) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const params =
        type === "slug" ? { slug: identifier } : { id: identifier };
      const result = await client.fetch<SanityDocument>(
        singleItemQuery,
        params
      );
      setItem(result);
    } catch (err) {
      console.error("Error occurred while fetching clothing item", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItem();
  }, [identifier, type]);

  return { item, loading, error, refetch: fetchItem };
};

// Server-side function to get clothes by category
export const getClothesByCategory = async (limit = 12) => {
  const clothesByCategoryQuery = `{
    "categories": *[_type == "clothingItem" && defined(category)]
      .category | order(@) | unique(),
    "allClothes": *[_type == "clothingItem" && defined(category) && defined(slug.current)]
      | order(_createdAt desc) {
        _id,
        title,
        slug,
        _createdAt,
        category,
        price,
        availability,
        stock,
        size,
        mainImage{
          asset->{_id, url},
          alt
        }
      }
  }`;

  try {
    const result = await client.fetch(clothesByCategoryQuery);

    const processedData: Record<string, SanityDocument[]> = {};
    const uniqueCategories = result.categories.filter(Boolean);

    // Group clothes by category with limit
    uniqueCategories.forEach((category: any) => {
      processedData[category] = result.allClothes
        .filter((item: any) => item.category === category)
        .slice(0, limit);
    });

    return {
      clothesByCategory: processedData,
      categories: uniqueCategories,
      error: null,
    };
  } catch (error) {
    console.error("Error occurred while fetching clothes by category", error);
    return { clothesByCategory: {}, categories: [], error: error as Error };
  }
};

// Generic hook for custom queries
export const useSanityQuery = <T = SanityDocument[]>(
  query: string,
  params = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await client.fetch<T>(query, params);
        setData(result);
      } catch (err) {
        console.error("Error occurred while fetching data", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [query, JSON.stringify(params)]);

  const refetch = async () => {
    try {
      setLoading(true);
      const result = await client.fetch<T>(query, params);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
};
