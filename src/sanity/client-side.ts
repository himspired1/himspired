import { createClient } from "next-sanity";

// Only public config! No tokens or secrets.
export const clientSideClient = createClient({
  projectId: "qdpdd240",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: true, // Use the CDN for faster, cacheable reads in the browser
});
