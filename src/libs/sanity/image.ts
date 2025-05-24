import { client } from "@/sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";

const builder = imageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

export interface SanityImage {
  _type: "image";
  asset: {
    _ref: string;
    _type: "reference";
  };
  alt?: string;
  caption?: string;
//   hotspot?: {
//     x: number;
//     y: number;
//     height: number;
//     width: number;
//   };
//   crop?: {
//     top: number;
//     bottom: number;
//     left: number;
//     right: number;
//   };
}
