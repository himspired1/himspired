import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["cdn.sanity.io", "res.cloudinary.com"],
  },
};

export default nextConfig;
