import { MongoClient, MongoClientOptions } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options: MongoClientOptions = {
  // Increased pool size for production scalability. Can be tuned via env var.
  maxPoolSize: process.env.MONGODB_MAX_POOL_SIZE
    ? parseInt(process.env.MONGODB_MAX_POOL_SIZE, 10)
    : 100,
  minPoolSize: 5, // Keep minimum connections ready
  maxIdleTimeMS: 30000, // Close idle connections after 30 seconds
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 60000,
  connectTimeoutMS: 30000,
  family: 4,
  retryWrites: true,
  retryReads: true,
  // OPTIMIZATION: Add connection pool monitoring
  monitorCommands: process.env.NODE_ENV === "development",
  // OPTIMIZATION: Use compression for better performance
  compressors: ["zlib"],
  zlibCompressionLevel: 6,
  // CRITICAL: Add better error handling and retry logic
  serverApi: {
    version: "1",
    strict: true,
    deprecationErrors: true,
  },
  // Add heartbeat frequency to detect connection issues faster
  heartbeatFrequencyMS: 10000,
  // Add connection string validation
  directConnection: false,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// CRITICAL: Add connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = await clientPromise;
    await client.db("admin").command({ ping: 1 });
    console.log("✅ MongoDB connection healthy");
    return true;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    return false;
  }
}

// CRITICAL: Add connection retry logic
export async function getClientWithRetry(maxRetries = 3): Promise<MongoClient> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = await clientPromise;
      // Test the connection
      await client.db("admin").command({ ping: 1 });
      return client;
    } catch (error) {
      console.error(`MongoDB connection attempt ${attempt} failed:`, error);

      if (attempt === maxRetries) {
        throw new Error(
          `Failed to connect to MongoDB after ${maxRetries} attempts`
        );
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`Retrying MongoDB connection in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Failed to connect to MongoDB");
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

// Performance logging wrapper
export async function withPerformanceLogging<T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await operation();
    const duration = Date.now() - startTime;

    // Log slow queries for optimization
    if (duration > 100) {
      console.log(`Slow query detected: ${operationName} took ${duration}ms`);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `Query failed: ${operationName} failed after ${duration}ms`,
      error
    );
    throw error;
  }
}
