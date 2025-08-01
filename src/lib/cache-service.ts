import { getCache, CacheInterface } from "./redis";

// Cache service for managing distributed caching
export class CacheService {
  private static instance: CacheService;
  private cache: CacheInterface;

  private constructor() {
    this.cache = getCache();
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Ping Redis to test connectivity
   */
  async ping(): Promise<boolean> {
    try {
      const redis = await this.getRedisClient();
      return redis.isAvailable();
    } catch (error) {
      console.error("Redis ping failed:", error);
      return false;
    }
  }

  /**
   * Get Redis client with fallback
   */
  private async getRedisClient(): Promise<CacheInterface> {
    if (this.cache.isAvailable()) {
      return this.cache;
    }
    // Fallback to a dummy client if Redis is not available
    console.warn("Redis is not available, using a dummy client for ping.");
    return {
      isAvailable: () => false,
      get: async () => null,
      set: async () => {},
      delete: async () => {},
      clear: async () => {},
    };
  }

  // Stock cache operations
  async getStockCache(
    productId: string,
    sessionId: string | null
  ): Promise<unknown | null> {
    const cacheKey = `stock:${productId}:${sessionId || "anonymous"}`;
    return await this.cache.get(cacheKey);
  }

  async setStockCache(
    productId: string,
    sessionId: string | null,
    data: unknown,
    ttl: number = 50
  ): Promise<void> {
    const cacheKey = `stock:${productId}:${sessionId || "anonymous"}`;
    await this.cache.set(cacheKey, data, ttl);
  }

  async clearStockCache(productId?: string): Promise<void> {
    if (productId) {
      await this.cache.clear(`stock:${productId}`);
    } else {
      await this.cache.clear("stock");
    }
  }

  // Session cache operations
  async getSessionCache(sessionId: string): Promise<unknown | null> {
    const cacheKey = `session:${sessionId}`;
    return await this.cache.get(cacheKey);
  }

  async setSessionCache(
    sessionId: string,
    data: unknown,
    ttl: number = 1800
  ): Promise<void> {
    const cacheKey = `session:${sessionId}`;
    await this.cache.set(cacheKey, data, ttl);
  }

  async clearSessionCache(sessionId: string): Promise<void> {
    const cacheKey = `session:${sessionId}`;
    await this.cache.delete(cacheKey);
  }

  // Reservation cache operations
  async getReservationCache(productId: string): Promise<unknown | null> {
    const cacheKey = `reservation:${productId}`;
    return await this.cache.get(cacheKey);
  }

  async setReservationCache(
    productId: string,
    data: unknown,
    ttl: number = 300
  ): Promise<void> {
    const cacheKey = `reservation:${productId}`;
    await this.cache.set(cacheKey, data, ttl);
  }

  async clearReservationCache(productId?: string): Promise<void> {
    if (productId) {
      await this.cache.clear(`reservation:${productId}`);
    } else {
      await this.cache.clear("reservation");
    }
  }

  // Order cache operations
  async getOrderCache(orderId: string): Promise<unknown | null> {
    const cacheKey = `order:${orderId}`;
    return await this.cache.get(cacheKey);
  }

  async setOrderCache(
    orderId: string,
    data: unknown,
    ttl: number = 3600
  ): Promise<void> {
    const cacheKey = `order:${orderId}`;
    await this.cache.set(cacheKey, data, ttl);
  }

  async clearOrderCache(orderId?: string): Promise<void> {
    if (orderId) {
      await this.cache.clear(`order:${orderId}`);
    } else {
      await this.cache.clear("order");
    }
  }

  // Product cache operations
  async getProductCache(productId: string): Promise<unknown | null> {
    const cacheKey = `product:${productId}`;
    return await this.cache.get(cacheKey);
  }

  async setProductCache(
    productId: string,
    data: unknown,
    ttl: number = 1800
  ): Promise<void> {
    const cacheKey = `product:${productId}`;
    await this.cache.set(cacheKey, data, ttl);
  }

  async clearProductCache(productId?: string): Promise<void> {
    if (productId) {
      await this.cache.clear(`product:${productId}`);
    } else {
      await this.cache.clear("product");
    }
  }

  // Rate limiting cache operations
  async getRateLimitCache(key: string): Promise<unknown | null> {
    const cacheKey = `ratelimit:${key}`;
    return await this.cache.get(cacheKey);
  }

  async setRateLimitCache(
    key: string,
    data: unknown,
    ttl: number = 300
  ): Promise<void> {
    const cacheKey = `ratelimit:${key}`;
    await this.cache.set(cacheKey, data, ttl);
  }

  // Cache statistics
  async getCacheStats(): Promise<{ available: boolean; type: string }> {
    return {
      available: this.cache.isAvailable(),
      type: this.cache.isAvailable() ? "redis" : "memory",
    };
  }

  // Bulk operations for cache invalidation
  async invalidateAllCaches(): Promise<void> {
    await this.cache.clear();
  }

  async invalidateProductRelatedCaches(productId: string): Promise<void> {
    await Promise.all([
      this.clearStockCache(productId),
      this.clearReservationCache(productId),
      this.clearProductCache(productId),
    ]);
  }

  async invalidateOrderRelatedCaches(orderId: string): Promise<void> {
    await Promise.all([
      this.clearOrderCache(orderId),
      // Clear stock caches for all products in the order
      this.clearStockCache(),
    ]);
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();
