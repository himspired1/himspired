import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: NextRequest) => string;
}

class RateLimiter {
  private static limits = new Map<
    string,
    { count: number; resetTime: number }
  >();
  private static cleanupInterval: NodeJS.Timeout | null = null;

  static {
    // Clean up expired rate limits every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupExpiredLimits();
      },
      5 * 60 * 1000
    );
  }

  /**
   * Clean up the rate limiter and prevent memory leaks
   * Call this method when the rate limiter is no longer needed
   * (e.g., during application shutdown, in serverless environments, or for testing)
   */
  static cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log("🧹 Rate limiter cleanup interval cleared");
    }

    // Clear all rate limits
    this.limits.clear();
    console.log("🧹 Rate limiter limits cleared");
  }

  static checkRateLimit(
    key: string,
    windowMs: number,
    maxRequests: number
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const limit = this.limits.get(key);

    if (!limit || now > limit.resetTime) {
      // Create new rate limit window
      this.limits.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: now + windowMs,
      };
    }

    if (limit.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetTime: limit.resetTime };
    }

    // Increment count
    limit.count++;
    return {
      allowed: true,
      remaining: maxRequests - limit.count,
      resetTime: limit.resetTime,
    };
  }

  private static cleanupExpiredLimits(): void {
    const now = Date.now();
    for (const [key, limit] of this.limits.entries()) {
      if (now > limit.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  static middleware(config: RateLimitConfig) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const key = config.keyGenerator
        ? config.keyGenerator(request)
        : this.getDefaultKey(request);

      const result = this.checkRateLimit(
        key,
        config.windowMs,
        config.maxRequests
      );

      if (!result.allowed) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            message: "Too many requests, please try again later",
            resetTime: new Date(result.resetTime).toISOString(),
          },
          { status: 429 }
        );
      }

      // Add rate limit headers
      const response = NextResponse.next();
      response.headers.set("X-RateLimit-Limit", config.maxRequests.toString());
      response.headers.set(
        "X-RateLimit-Remaining",
        result.remaining.toString()
      );
      response.headers.set(
        "X-RateLimit-Reset",
        new Date(result.resetTime).toISOString()
      );

      return response; // Return the response object to continue processing
    };
  }

  /**
   * Check rate limit for API route handlers
   * This method is designed for use in API route handlers, not middleware
   */
  static checkRateLimitForAPI(
    request: NextRequest,
    config: RateLimitConfig
  ): { allowed: boolean; response?: NextResponse } {
    const key = config.keyGenerator
      ? config.keyGenerator(request)
      : this.getDefaultKey(request);

    const result = this.checkRateLimit(
      key,
      config.windowMs,
      config.maxRequests
    );

    if (!result.allowed) {
      return {
        allowed: false,
        response: NextResponse.json(
          {
            error: "Rate limit exceeded",
            message: "Too many requests, please try again later",
            resetTime: new Date(result.resetTime).toISOString(),
          },
          { status: 429 }
        ),
      };
    }

    return { allowed: true };
  }

  private static getDefaultKey(request: NextRequest): string {
    // Try to get IP from various headers
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      request.headers.get("cf-connecting-ip") || // Cloudflare
      request.headers.get("x-client-ip") ||
      "no-ip";

    // Create a more granular key by incorporating request properties
    const method = request.method;
    const url = new URL(request.url);
    const path = url.pathname;

    // Include user agent as additional differentiation (truncated for security)
    const userAgent = request.headers.get("user-agent") || "no-ua";
    const userAgentHash = this.hashString(userAgent.substring(0, 50)); // Truncate for security

    // Include referer as additional differentiation
    const referer = request.headers.get("referer") || "no-referer";
    const refererHash = this.hashString(referer.substring(0, 50)); // Truncate for security

    // Create a unique key combining multiple request properties
    const uniqueKey = `${ip}:${method}:${path}:${userAgentHash}:${refererHash}`;

    return `rate_limit:${uniqueKey}`;
  }

  /**
   * Simple hash function to create consistent hashes for strings
   * This helps differentiate requests while maintaining security
   */
  private static hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36); // Convert to base36 for shorter strings
  }
}

export { RateLimiter };
export type { RateLimitConfig };
