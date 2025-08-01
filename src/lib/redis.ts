import Redis from "ioredis";

// Redis configuration with fallback to in-memory cache
const REDIS_URL = process.env.REDIS_URL;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_PORT = process.env.REDIS_PORT
  ? parseInt(process.env.REDIS_PORT, 10)
  : 6379;
const REDIS_HOST = process.env.REDIS_HOST || "localhost";

// Cache configuration
const CACHE_TTL = 50; // 50 seconds (matching existing cache)
const CACHE_NAMESPACE = "himspired";

// Redis client with connection pooling and retry logic
let redisClient: Redis | null = null;
let isRedisAvailable = false;

// Initialize Redis client with fallback
const initializeRedis = async (): Promise<Redis | null> => {
  if (redisClient) {
    return redisClient;
  }

  try {
    if (REDIS_URL) {
      // Use Redis URL if provided
      redisClient = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
      });
    } else {
      // Use individual config
      redisClient = new Redis({
        host: REDIS_HOST,
        port: REDIS_PORT,
        password: REDIS_PASSWORD,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
      });
    }

    // Test connection
    await redisClient.ping();
    isRedisAvailable = true;
    console.log("✅ Redis connected successfully");

    return redisClient;
  } catch {
    console.warn("⚠️ Redis connection failed, falling back to in-memory cache");
    isRedisAvailable = false;
    return null;
  }
};

// Cache interface that works with both Redis and in-memory
export interface CacheInterface {
  get(key: string): Promise<unknown | null>;
  set(key: string, value: unknown, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(pattern?: string): Promise<void>;
  isAvailable(): boolean;
}

// Redis-based cache implementation
class RedisCache implements CacheInterface {
  private client: Redis | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    this.client = await initializeRedis();
  }

  async get(key: string): Promise<unknown | null> {
    if (!this.client || !isRedisAvailable) {
      return null;
    }

    try {
      const value = await this.client.get(`${CACHE_NAMESPACE}:${key}`);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn("Redis get error:", error);
      return null;
    }
  }

  async set(
    key: string,
    value: unknown,
    ttl: number = CACHE_TTL
  ): Promise<void> {
    if (!this.client || !isRedisAvailable) {
      return;
    }

    try {
      await this.client.setex(
        `${CACHE_NAMESPACE}:${key}`,
        ttl,
        JSON.stringify(value)
      );
    } catch (error) {
      console.warn("Redis set error:", error);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.client || !isRedisAvailable) {
      return;
    }

    try {
      await this.client.del(`${CACHE_NAMESPACE}:${key}`);
    } catch (error) {
      console.warn("Redis delete error:", error);
    }
  }

  async clear(pattern?: string): Promise<void> {
    if (!this.client || !isRedisAvailable) {
      return;
    }

    try {
      const searchPattern = pattern
        ? `${CACHE_NAMESPACE}:${pattern}*`
        : `${CACHE_NAMESPACE}:*`;

      const keys = await this.client.keys(searchPattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch {
      console.warn("Redis clear error");
    }
  }

  isAvailable(): boolean {
    return isRedisAvailable;
  }
}

// In-memory fallback cache implementation
class InMemoryCache implements CacheInterface {
  private cache = new Map<
    string,
    { value: unknown; timestamp: number; ttl: number }
  >();

  async get(key: string): Promise<unknown | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(
    key: string,
    value: unknown,
    ttl: number = CACHE_TTL
  ): Promise<void> {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(pattern?: string): Promise<void> {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  isAvailable(): boolean {
    return true;
  }
}

// Export singleton cache instance
export const cache = new RedisCache();
export const fallbackCache = new InMemoryCache();

// Utility function to get the best available cache
export const getCache = (): CacheInterface => {
  return cache.isAvailable() ? cache : fallbackCache;
};

// Graceful shutdown
export const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isRedisAvailable = false;
  }
};

// Health check
export const checkRedisHealth = async (): Promise<boolean> => {
  try {
    if (!redisClient) {
      await initializeRedis();
    }
    
    if (redisClient && isRedisAvailable) {
      // Test the connection with a ping
      await redisClient.ping();
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
};
