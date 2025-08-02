import { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/cart/checkout",
        "/order-success",
        "/_next/",
        "/favicon.ico",
      ],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
