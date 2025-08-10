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
  } catch (error) {
    console.warn(
      `⚠️ Redis connection failed, falling back to in-memory cache. Error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
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
  destroy(): void;
  // Atomic Redis operations for rate limiting
  incr(key: string): Promise<number>;
  setnx(key: string, value: unknown, ttl?: number): Promise<boolean>;
}

// Redis-based cache implementation
class RedisCache implements CacheInterface {
  private client: Redis | null = null;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Don't call initialize in constructor to avoid race conditions
  }

  /**
   * Initialize Redis client lazily
   * This method is called automatically when needed, but can also be called explicitly
   */
  private async initialize(): Promise<void> {
    if (this.initializationPromise) {
      // If initialization is already in progress, wait for it
      await this.initializationPromise;
      return;
    }

    // Start initialization
    this.initializationPromise = this.performInitialization();
    await this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      this.client = await initializeRedis();
    } catch (error) {
      console.warn("Redis initialization failed:", error);
      this.client = null;
    } finally {
      // Clear the promise so future calls can retry if needed
      this.initializationPromise = null;
    }
  }

  async get(key: string): Promise<unknown | null> {
    // Ensure Redis is initialized before use
    await this.initialize();

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
    // Ensure Redis is initialized before use
    await this.initialize();

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
    // Ensure Redis is initialized before use
    await this.initialize();

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
    // Ensure Redis is initialized before use
    await this.initialize();

    if (!this.client || !isRedisAvailable) {
      return;
    }

    try {
      const searchPattern = pattern
        ? `${CACHE_NAMESPACE}:${pattern}*`
        : `${CACHE_NAMESPACE}:*`;

      // Use SCAN instead of KEYS to avoid blocking the server
      const keysToDelete: string[] = [];
      let cursor = "0";
      const scanCount = 100; // Number of keys to scan per iteration

      do {
        const result = await this.client.scan(
          cursor,
          "MATCH",
          searchPattern,
          "COUNT",
          scanCount
        );

        cursor = result[0];
        const keys = result[1];

        if (keys.length > 0) {
          keysToDelete.push(...keys);
        }
      } while (cursor !== "0");

      // Delete all collected keys in batches to avoid blocking
      if (keysToDelete.length > 0) {
        const batchSize = 100; // Delete keys in batches
        for (let i = 0; i < keysToDelete.length; i += batchSize) {
          const batch = keysToDelete.slice(i, i + batchSize);
          await this.client.del(...batch);
        }

        console.log(`🧹 Cleared ${keysToDelete.length} keys using SCAN`);
      }
    } catch (error) {
      console.warn("Redis clear error:", error);
    }
  }

  /**
   * Public method to explicitly initialize Redis
   * Useful for ensuring Redis is ready before starting operations
   */
  async ensureInitialized(): Promise<void> {
    await this.initialize();
  }

  /**
   * Clean up the Redis cache instance
   * Call this method when the instance is no longer needed to prevent memory leaks
   */
  destroy(): void {
    // Redis cleanup is handled by the global closeRedis function
    console.log("🧹 Redis cache destroyed");
  }

  isAvailable(): boolean {
    return isRedisAvailable;
  }

  // Atomic Redis operations for rate limiting
  async incr(key: string): Promise<number> {
    await this.ensureInitialized();
    if (!this.client) {
      throw new Error("Redis client not available");
    }
    return await this.client.incr(key);
  }

  async setnx(key: string, value: unknown, ttl?: number): Promise<boolean> {
    await this.ensureInitialized();
    if (!this.client) {
      throw new Error("Redis client not available");
    }
    
    // Use Redis SET with NX (only if key doesn't exist) and EX (expiration)
    const result = await this.client.set(
      key,
      String(value),
      'EX',
      ttl || CACHE_TTL,
      'NX'
    );
    
    // SET with NX returns 'OK' if key was set, null if key already exists
    return result === 'OK';
  }
}

// In-memory fallback cache implementation
class InMemoryCache implements CacheInterface {
  private cache = new Map<
    string,
    { value: unknown; timestamp: number; ttl: number }
  >();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start periodic cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 60 * 1000); // 60 seconds
  }

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
      // Create a more precise pattern matcher
      const patternMatcher = this.createPatternMatcher(pattern);

      for (const key of this.cache.keys()) {
        if (patternMatcher(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Create a precise pattern matcher that handles different pattern types
   * @param pattern - The pattern to match against
   * @returns A function that returns true if a key matches the pattern
   */
  private createPatternMatcher(pattern: string): (key: string) => boolean {
    // If pattern ends with *, treat it as a prefix match
    if (pattern.endsWith("*")) {
      const prefix = pattern.slice(0, -1);
      return (key: string) => key.startsWith(prefix);
    }

    // If pattern starts with *, treat it as a suffix match
    if (pattern.startsWith("*")) {
      const suffix = pattern.slice(1);
      return (key: string) => key.endsWith(suffix);
    }

    // If pattern contains *, treat it as a wildcard pattern
    if (pattern.includes("*")) {
      const regexPattern = pattern
        .replace(/\*/g, ".*") // Replace * with .* for regex
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Escape regex special characters
      const regex = new RegExp(`^${regexPattern}$`);
      return (key: string) => regex.test(key);
    }

    // Otherwise, treat as exact match
    return (key: string) => key === pattern;
  }

  /**
   * Clean up expired entries from the cache
   * Called periodically to prevent memory buildup
   */
  private cleanupExpired(): void {
    const now = Date.now();
    let cleanedCount = 0;
    const initialSize = this.cache.size;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(
        `🧹 In-memory cache cleanup: removed ${cleanedCount} expired entries (${initialSize} → ${this.cache.size})`
      );
    }
  }

  /**
   * Clean up the in-memory cache instance
   * Call this method when the instance is no longer needed to prevent memory leaks
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log("🧹 In-memory cache destroyed");
    }
    this.cache.clear();
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

  // Clean up cache instances
  cache.destroy();
  fallbackCache.destroy();
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
  } catch (error) {
    console.warn("Redis health check failed:", error);
    return false;
  }
};
