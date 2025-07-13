import { MongoClient, MongoClientOptions } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.warn('MongoDB URI not found in environment variables');
  console.warn('Using fallback connection or skipping database operations');
}

// Connection options with pooling - OPTIMIZED FOR AFRICA
const options: MongoClientOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 30000, // Increased from 5000 for Africa
  socketTimeoutMS: 60000,          // Increased from 45000
  connectTimeoutMS: 30000,         // Added for initial connection
  family: 4,
  retryWrites: true,
  retryReads: true,
};

let clientPromise: Promise<MongoClient>;
let cachedClientPromise: Promise<MongoClient> | null = null;

// Retry connection helper
const connectWithRetry = async (retries = 3): Promise<MongoClient> => {
  if (!uri) {
    throw new Error('MongoDB URI is required for database operations');
  }
  
  for (let i = 0; i < retries; i++) {
    try {
      const mongoClient = new MongoClient(uri, options);
      await mongoClient.connect();
      
      // Test connection
      await mongoClient.db('admin').command({ ping: 1 });
      
      return mongoClient;
    } catch (error) {
      console.error(`MongoDB connection attempt ${i + 1} failed:`, error instanceof Error ? error.message : 'Unknown error');
      
      if (i === retries - 1) {
        throw error;
      }
      
      // Wait before retry - longer delays for high latency
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
  
  throw new Error('Failed to connect after retries');
};

// Initialize connection only if URI is available
if (!uri) {
  clientPromise = Promise.reject(new Error('MongoDB URI not configured'));
} else if (process.env.NODE_ENV === 'development') {
  if (!cachedClientPromise) {
    cachedClientPromise = connectWithRetry();
  }
  clientPromise = cachedClientPromise;
} else {
  clientPromise = connectWithRetry();
}

// Performance monitoring wrapper
export const withPerformanceLogging = async <T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> => {
  const startTime = Date.now();
  
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    
    // Only log in development or if really slow
    if (process.env.NODE_ENV === 'development' && duration > 100) {
      console.warn(`Slow query detected: ${operation} took ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Query failed: ${operation} failed after ${duration}ms`, error);
    throw error;
  }
};

export default clientPromise;