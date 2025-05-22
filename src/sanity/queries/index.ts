export const ClothQueryPath = `*[
    _type == "clothingItems"
    && defined(slug.current)
  ]|order(publishedAt desc)[0...12]{_id, title, slug, publishedAt}`;
// export const Thrift = `*[
//     _type == "clothingItems"
//     && defined(slug.current)
//   ]|order(publishedAt desc)[0...12]{_id, title, slug, publishedAt}`;

import { SanityDocument } from "next-sanity";
import { client } from "../client";

const options = { next: { revalidate: 30 } };

export const ClothQuery = async () => {
  let loading;
  try {
    loading = true;
    const clothes = client.fetch<SanityDocument[]>(ClothQueryPath, {}, options);

    return { clothes, loading };
  } catch (error) {
    console.error("Error occured while fetching clothes", error);
  } finally {
    loading = false;
  }
};
