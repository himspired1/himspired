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
    return async (request: NextRequest): Promise<NextResponse | null> => {
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

      return null; // Continue to next middleware/handler
    };
  }

  private static getDefaultKey(request: NextRequest): string {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    return `rate_limit:${ip}`;
  }
}

export { RateLimiter };
export type { RateLimitConfig };
