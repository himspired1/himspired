import { getCache } from "./redis";

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  keyPrefix: string;
}

export class RateLimiter {
  private cache: ReturnType<typeof getCache>;

  constructor() {
    this.cache = getCache();
  }

  /**
   * Check if a request is allowed based on rate limiting rules
   * @param key - Unique identifier for the rate limit (e.g., IP address)
   * @param config - Rate limiting configuration
   * @returns Object with allowed status and remaining attempts
   */
  async checkRateLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const cacheKey = `${config.keyPrefix}:${key}`;
    const countKey = `${cacheKey}:count`;
    const firstAttemptKey = `${cacheKey}:first`;

    try {
      // Use atomic operations to prevent race conditions
      const [countResult, firstAttemptResult] = await Promise.all([
        this.cache.get(countKey),
        this.cache.get(firstAttemptKey),
      ]);

      let count = 0;
      let firstAttempt = now;

      // Parse current count
      if (countResult && typeof countResult === "string") {
        const parsedCount = parseInt(countResult, 10);
        if (!isNaN(parsedCount)) {
          count = parsedCount;
        }
      }

      // Parse first attempt time
      if (firstAttemptResult && typeof firstAttemptResult === "string") {
        const parsedFirstAttempt = parseInt(firstAttemptResult, 10);
        if (!isNaN(parsedFirstAttempt)) {
          firstAttempt = parsedFirstAttempt;
        }
      }

      // Check if window has expired
      if (now - firstAttempt > config.windowMs) {
        // Reset for new window - atomic operations
        await Promise.all([
          this.cache.set(countKey, "1", Math.ceil(config.windowMs / 1000)),
          this.cache.set(
            firstAttemptKey,
            now.toString(),
            Math.ceil(config.windowMs / 1000)
          ),
        ]);

        return {
          allowed: true,
          remaining: config.maxAttempts - 1,
          resetTime: now + config.windowMs,
        };
      }

      // Atomic increment of count
      const newCount = count + 1;
      const ttlSeconds = Math.ceil(config.windowMs / 1000);

      // Set count with TTL (only set TTL on first attempt)
      if (count === 0) {
        await Promise.all([
          this.cache.set(countKey, newCount.toString(), ttlSeconds),
          this.cache.set(firstAttemptKey, firstAttempt.toString(), ttlSeconds),
        ]);
      } else {
        await this.cache.set(countKey, newCount.toString());
      }

      // Check if limit exceeded
      const allowed = newCount <= config.maxAttempts;
      const remaining = Math.max(0, config.maxAttempts - newCount);
      const resetTime = firstAttempt + config.windowMs;

      return {
        allowed,
        remaining,
        resetTime,
      };
    } catch (error) {
      console.error("Rate limiting error:", error);
      // If Redis fails, allow the request but log the error
      return {
        allowed: true,
        remaining: config.maxAttempts,
        resetTime: now + config.windowMs,
      };
    }
  }

  /**
   * Get rate limit information without incrementing the counter
   * @param key - Unique identifier for the rate limit
   * @param config - Rate limiting configuration
   * @returns Current rate limit status
   */
  async getRateLimitInfo(
    key: string,
    config: RateLimitConfig
  ): Promise<{ remaining: number; resetTime: number; totalAttempts: number }> {
    const now = Date.now();
    const cacheKey = `${config.keyPrefix}:${key}`;
    const countKey = `${cacheKey}:count`;
    const firstAttemptKey = `${cacheKey}:first`;

    try {
      const [countResult, firstAttemptResult] = await Promise.all([
        this.cache.get(countKey),
        this.cache.get(firstAttemptKey),
      ]);

      let count = 0;
      let firstAttempt = now;

      // Parse current count
      if (countResult && typeof countResult === "string") {
        try {
          count = parseInt(countResult, 10);
        } catch (parseError) {
          console.error("Failed to parse count:", parseError);
          count = 0;
        }
      }

      // Parse first attempt time
      if (firstAttemptResult && typeof firstAttemptResult === "string") {
        try {
          firstAttempt = parseInt(firstAttemptResult, 10);
        } catch (parseError) {
          console.error("Failed to parse first attempt:", parseError);
          firstAttempt = now;
        }
      }

      // Check if window has expired
      if (now - firstAttempt > config.windowMs) {
        return {
          remaining: config.maxAttempts,
          resetTime: now + config.windowMs,
          totalAttempts: 0,
        };
      }

      const remaining = Math.max(0, config.maxAttempts - count);
      const resetTime = firstAttempt + config.windowMs;

      return {
        remaining,
        resetTime,
        totalAttempts: count,
      };
    } catch (error) {
      console.error("Rate limit info error:", error);
      return {
        remaining: config.maxAttempts,
        resetTime: now + config.windowMs,
        totalAttempts: 0,
      };
    }
  }

  /**
   * Reset rate limit for a specific key
   * @param key - Unique identifier for the rate limit
   * @param config - Rate limiting configuration
   */
  async resetRateLimit(key: string, config: RateLimitConfig): Promise<void> {
    const cacheKey = `${config.keyPrefix}:${key}`;
    const countKey = `${cacheKey}:count`;
    const firstAttemptKey = `${cacheKey}:first`;

    try {
      // Delete both count and first attempt keys atomically
      await Promise.all([
        this.cache.delete(countKey),
        this.cache.delete(firstAttemptKey),
      ]);
    } catch (error) {
      console.error("Rate limit reset error:", error);
    }
  }

  /**
   * Clean up expired rate limit entries (for in-memory fallback)
   * This is mainly for the in-memory cache fallback
   */
  async cleanup(): Promise<void> {
    // Redis handles TTL automatically, so this is mainly for in-memory fallback
    // Implementation would depend on the cache implementation
  }
}

// Default rate limiting configurations
export const RATE_LIMIT_CONFIGS = {
  DELIVERY_FEES: {
    maxAttempts: 100,
    windowMs: 10 * 60 * 1000, // 10 minutes
    keyPrefix: "rate_limit:delivery_fees",
  },
  API_GENERAL: {
    maxAttempts: 1000,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: "rate_limit:api_general",
  },
  AUTH: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyPrefix: "rate_limit:auth",
  },
  NEWSLETTER: {
    maxAttempts: 3,
    windowMs: 30 * 60 * 1000, // 30 minutes
    keyPrefix: "rate_limit:newsletter",
  },
  ORDERS_SESSION: {
    maxAttempts: 3,
    windowMs: 30 * 60 * 1000, // 30 minutes
    keyPrefix: "rate_limit:orders_session",
  },
  ORDERS_IP: {
    maxAttempts: 100,
    windowMs: 30 * 60 * 1000, // 30 minutes
    keyPrefix: "rate_limit:orders_ip",
  },
} as const;

// Export singleton instance
export const rateLimiter = new RateLimiter();
