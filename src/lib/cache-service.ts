import { getCache, CacheInterface } from "./redis";

// Cache service for managing distributed caching
export class CacheService {
  private static instance: CacheService;
  private cache: CacheInterface;

  private constructor() {
    this.cache = getCache();
  }

  /**
   * Sanitize cache keys to prevent collisions from special characters
   * @param key - The key to sanitize
   * @returns Sanitized key safe for cache storage
   */
  private sanitizeKey(key: string): string {
    return key
      .replace(/[:]/g, "_") // Replace colons with underscores
      .replace(/[ ]/g, "_") // Replace spaces with underscores
      .replace(/[\/\\]/g, "_") // Replace slashes with underscores
      .replace(/[^\w\-_]/g, "_"); // Replace any other non-word chars with underscores
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
      destroy: () => {},
      incr: async () => 1,
      setnx: async () => true,
    };
  }

  // Stock cache operations
  async getStockCache(
    productId: string,
    sessionId: string | null
  ): Promise<unknown | null> {
    const sanitizedProductId = this.sanitizeKey(productId);
    const sanitizedSessionId = sessionId
      ? this.sanitizeKey(sessionId)
      : "anonymous";
    const cacheKey = `stock:${sanitizedProductId}:${sanitizedSessionId}`;
    return await this.cache.get(cacheKey);
  }

  async setStockCache(
    productId: string,
    sessionId: string | null,
    data: unknown,
    ttl: number = 50
  ): Promise<void> {
    const sanitizedProductId = this.sanitizeKey(productId);
    const sanitizedSessionId = sessionId
      ? this.sanitizeKey(sessionId)
      : "anonymous";
    const cacheKey = `stock:${sanitizedProductId}:${sanitizedSessionId}`;
    await this.cache.set(cacheKey, data, ttl);
  }

  async clearStockCache(productId?: string): Promise<void> {
    if (productId) {
      const sanitizedProductId = this.sanitizeKey(productId);
      await this.cache.clear(`stock:${sanitizedProductId}`);
    } else {
      await this.cache.clear("stock");
    }
  }

  // Session cache operations
  async getSessionCache(sessionId: string): Promise<unknown | null> {
    const sanitizedSessionId = this.sanitizeKey(sessionId);
    const cacheKey = `session:${sanitizedSessionId}`;
    return await this.cache.get(cacheKey);
  }

  async setSessionCache(
    sessionId: string,
    data: unknown,
    ttl: number = 1800
  ): Promise<void> {
    const sanitizedSessionId = this.sanitizeKey(sessionId);
    const cacheKey = `session:${sanitizedSessionId}`;
    await this.cache.set(cacheKey, data, ttl);
  }

  async clearSessionCache(sessionId: string): Promise<void> {
    const sanitizedSessionId = this.sanitizeKey(sessionId);
    const cacheKey = `session:${sanitizedSessionId}`;
    await this.cache.delete(cacheKey);
  }

  // Reservation cache operations
  async getReservationCache(productId: string): Promise<unknown | null> {
    const sanitizedProductId = this.sanitizeKey(productId);
    const cacheKey = `reservation:${sanitizedProductId}`;
    return await this.cache.get(cacheKey);
  }

  async setReservationCache(
    productId: string,
    data: unknown,
    ttl: number = 300
  ): Promise<void> {
    const sanitizedProductId = this.sanitizeKey(productId);
    const cacheKey = `reservation:${sanitizedProductId}`;
    await this.cache.set(cacheKey, data, ttl);
  }

  async clearReservationCache(productId?: string): Promise<void> {
    if (productId) {
      const sanitizedProductId = this.sanitizeKey(productId);
      await this.cache.clear(`reservation:${sanitizedProductId}`);
    } else {
      await this.cache.clear("reservation");
    }
  }

  // Order cache operations
  async getOrderCache(orderId: string): Promise<unknown | null> {
    const sanitizedOrderId = this.sanitizeKey(orderId);
    const cacheKey = `order:${sanitizedOrderId}`;
    return await this.cache.get(cacheKey);
  }

  async setOrderCache(
    orderId: string,
    data: unknown,
    ttl: number = 3600
  ): Promise<void> {
    const sanitizedOrderId = this.sanitizeKey(orderId);
    const cacheKey = `order:${sanitizedOrderId}`;
    await this.cache.set(cacheKey, data, ttl);
  }

  async clearOrderCache(orderId?: string): Promise<void> {
    if (orderId) {
      const sanitizedOrderId = this.sanitizeKey(orderId);
      await this.cache.clear(`order:${sanitizedOrderId}`);
    } else {
      await this.cache.clear("order");
    }
  }

  // Product cache operations
  async getProductCache(productId: string): Promise<unknown | null> {
    const sanitizedProductId = this.sanitizeKey(productId);
    const cacheKey = `product:${sanitizedProductId}`;
    return await this.cache.get(cacheKey);
  }

  async setProductCache(
    productId: string,
    data: unknown,
    ttl: number = 1800
  ): Promise<void> {
    const sanitizedProductId = this.sanitizeKey(productId);
    const cacheKey = `product:${sanitizedProductId}`;
    await this.cache.set(cacheKey, data, ttl);
  }

  async clearProductCache(productId?: string): Promise<void> {
    if (productId) {
      const sanitizedProductId = this.sanitizeKey(productId);
      await this.cache.clear(`product:${sanitizedProductId}`);
    } else {
      await this.cache.clear("product");
    }
  }

  // Rate limiting cache operations
  async getRateLimitCache(key: string): Promise<unknown | null> {
    const sanitizedKey = this.sanitizeKey(key);
    const cacheKey = `ratelimit:${sanitizedKey}`;
    return await this.cache.get(cacheKey);
  }

  async setRateLimitCache(
    key: string,
    data: unknown,
    ttl: number = 300
  ): Promise<void> {
    const sanitizedKey = this.sanitizeKey(key);
    const cacheKey = `ratelimit:${sanitizedKey}`;
    await this.cache.set(cacheKey, data, ttl);
  }

  // Delivery fee cache operations
  async getDeliveryFeeCache(state: string): Promise<unknown | null> {
    const sanitizedState = this.sanitizeKey(state);
    const cacheKey = `delivery_fee:${sanitizedState}`;
    return await this.cache.get(cacheKey);
  }

  async setDeliveryFeeCache(
    state: string,
    data: unknown,
    ttl: number = 3600
  ): Promise<void> {
    const sanitizedState = this.sanitizeKey(state);
    const cacheKey = `delivery_fee:${sanitizedState}`;
    await this.cache.set(cacheKey, data, ttl);
  }

  async clearDeliveryFeeCache(state?: string): Promise<void> {
    if (state) {
      const sanitizedState = this.sanitizeKey(state);
      await this.cache.clear(`delivery_fee:${sanitizedState}`);
    } else {
      await this.cache.clear("delivery_fee");
    }
  }

  // Analytics cache operations
  async getAnalyticsCache(
    type: string,
    range: string,
    params?: Record<string, string | number | boolean>
  ): Promise<unknown | null> {
    const sanitizedType = this.sanitizeKey(type);
    const sanitizedRange = this.sanitizeKey(range);
    const paramString = params ? JSON.stringify(params) : "";
    const sanitizedParams = this.sanitizeKey(paramString);
    const cacheKey = `analytics:${sanitizedType}:${sanitizedRange}:${sanitizedParams}`;
    return await this.cache.get(cacheKey);
  }

  async setAnalyticsCache(
    type: string,
    range: string,
    data: unknown,
    params?: Record<string, string | number | boolean>,
    ttl: number = 300 // 5 minutes cache for analytics
  ): Promise<void> {
    const sanitizedType = this.sanitizeKey(type);
    const sanitizedRange = this.sanitizeKey(range);
    const paramString = params ? JSON.stringify(params) : "";
    const sanitizedParams = this.sanitizeKey(paramString);
    const cacheKey = `analytics:${sanitizedType}:${sanitizedRange}:${sanitizedParams}`;
    await this.cache.set(cacheKey, data, ttl);
  }

  async clearAnalyticsCache(type?: string): Promise<void> {
    if (type) {
      const sanitizedType = this.sanitizeKey(type);
      await this.cache.clear(`analytics:${sanitizedType}`);
    } else {
      await this.cache.clear("analytics");
    }
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

  async invalidateOrderRelatedCaches(
    orderId: string,
    productIds?: string[]
  ): Promise<void> {
    await Promise.all([
      this.clearOrderCache(orderId),
      // Clear stock caches only for products in this specific order
      ...(productIds?.map((productId) => this.clearStockCache(productId)) ||
        []),
    ]);
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();
