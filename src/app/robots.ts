import { MetadataRoute } from "next";

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
    sitemap: "https://himspired.vercel.app/sitemap.xml",
  };
}
