import { createClient } from "next-sanity";

export const client = createClient({
  projectId: "qdpdd240",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
});

// For server-side mutations (writes)
export const writeClient = createClient({
  projectId: "qdpdd240",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_TOKEN, // Must be set in your environment
});
