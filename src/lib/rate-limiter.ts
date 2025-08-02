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

    try {
      // Get current rate limit data
      const currentData = await this.cache.get(cacheKey);
      let rateLimitData: { count: number; firstAttempt: number } | null = null;

      if (currentData && typeof currentData === "string") {
        try {
          rateLimitData = JSON.parse(currentData);
        } catch (parseError) {
          console.error("Failed to parse rate limit data:", parseError);
          rateLimitData = null;
        }
      }

      // Check if window has expired
      if (
        !rateLimitData ||
        now - rateLimitData.firstAttempt > config.windowMs
      ) {
        // Reset rate limit for new window
        rateLimitData = { count: 0, firstAttempt: now };
      }

      // Increment attempt count
      rateLimitData.count++;

      // Check if limit exceeded
      const allowed = rateLimitData.count <= config.maxAttempts;
      const remaining = Math.max(0, config.maxAttempts - rateLimitData.count);
      const resetTime = rateLimitData.firstAttempt + config.windowMs;

      // Store updated data with TTL to auto-expire
      const ttlSeconds = Math.ceil(config.windowMs / 1000);
      await this.cache.set(cacheKey, JSON.stringify(rateLimitData), ttlSeconds);

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

    try {
      const currentData = await this.cache.get(cacheKey);

      if (!currentData || typeof currentData !== "string") {
        return {
          remaining: config.maxAttempts,
          resetTime: now + config.windowMs,
          totalAttempts: 0,
        };
      }

      try {
        const rateLimitData = JSON.parse(currentData);
        const remaining = Math.max(0, config.maxAttempts - rateLimitData.count);
        const resetTime = rateLimitData.firstAttempt + config.windowMs;

        return {
          remaining,
          resetTime,
          totalAttempts: rateLimitData.count,
        };
      } catch (parseError) {
        console.error("Failed to parse rate limit info:", parseError);
        return {
          remaining: config.maxAttempts,
          resetTime: now + config.windowMs,
          totalAttempts: 0,
        };
      }
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

    try {
      await this.cache.delete(cacheKey);
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
} as const;

// Export singleton instance
export const rateLimiter = new RateLimiter();
