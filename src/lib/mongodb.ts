import { MongoClient, MongoClientOptions } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.warn("MongoDB URI not found in environment variables");
  console.warn("Using fallback connection or skipping database operations");
}

const options: MongoClientOptions = {
  // Increased pool size for production scalability. Can be tuned via env var.
  maxPoolSize: process.env.MONGODB_MAX_POOL_SIZE
    ? parseInt(process.env.MONGODB_MAX_POOL_SIZE, 10)
    : 100,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 60000,
  connectTimeoutMS: 30000,
  family: 4,
  retryWrites: true,
  retryReads: true,
};

let clientPromise: Promise<MongoClient>;
let cachedClientPromise: Promise<MongoClient> | null = null;

const connectWithRetry = async (retries = 3): Promise<MongoClient> => {
  if (!uri) {
    throw new Error("MongoDB URI is required for database operations");
  }

  for (let i = 0; i < retries; i++) {
    try {
      const mongoClient = new MongoClient(uri, options);
      await mongoClient.connect();

      await mongoClient.db("admin").command({ ping: 1 });

      return mongoClient;
    } catch (error) {
      console.error(
        `MongoDB connection attempt ${i + 1} failed:`,
        error instanceof Error ? error.message : "Unknown error"
      );

      if (i === retries - 1) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000 * (i + 1)));
    }
  }

  throw new Error("Failed to connect after retries");
};

if (!uri) {
  clientPromise = Promise.reject(new Error("MongoDB URI not configured"));
} else if (process.env.NODE_ENV === "development") {
  if (!cachedClientPromise) {
    cachedClientPromise = connectWithRetry();
  }
  clientPromise = cachedClientPromise;
} else {
  clientPromise = connectWithRetry();
}

export const withPerformanceLogging = async <T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> => {
  const startTime = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    if (process.env.NODE_ENV === "development" && duration > 100) {
      console.warn(`Slow query detected: ${operation} took ${duration}ms`);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `Query failed: ${operation} failed after ${duration}ms`,
      error
    );
    throw error;
  }
};

export default clientPromise;
