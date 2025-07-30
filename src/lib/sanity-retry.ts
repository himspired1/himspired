/**
 * Utility for retrying Sanity operations with exponential backoff
 * Handles concurrent writes and rate limiting gracefully
 */

export async function retrySanityOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // If it's the last attempt, throw the error
      if (attempt === maxRetries - 1) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(
        `Sanity operation failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Rate limiting utility for Sanity operations
 *
 * Features:
 * - Rate limiting with configurable limits
 * - Automatic cleanup of expired entries to prevent memory leaks
 * - Memory usage monitoring and statistics
 * - Manual cleanup triggers for testing
 *
 * Memory Management:
 * - Periodic cleanup every 5 minutes
 * - Automatic removal of expired rate limit entries
 * - Memory usage statistics for monitoring
 */
export class SanityRateLimiter {
  private requestCounts = new Map<
    string,
    { count: number; resetTime: number }
  >();
  private readonly maxRequestsPerMinute = 900; // Conservative limit
  private readonly windowMs = 60000; // 1 minute
  private lastCleanup = Date.now();
  private readonly cleanupInterval = 300000; // 5 minutes

  /**
   * Clean up expired entries from requestCounts to prevent memory leaks
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;
    const initialSize = this.requestCounts.size;

    for (const [key, value] of this.requestCounts.entries()) {
      if (now > value.resetTime) {
        this.requestCounts.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(
        `🧹 Cleaned up ${cleanedCount} expired rate limit entries (${initialSize} → ${this.requestCounts.size})`
      );
    }
  }

  /**
   * Manually trigger cleanup of expired entries
   * Useful for testing or manual memory management
   */
  public forceCleanup(): void {
    this.cleanupExpiredEntries();
    this.lastCleanup = Date.now();
  }

  /**
   * Get current memory usage statistics
   * Useful for monitoring and debugging
   */
  public getMemoryStats(): {
    totalEntries: number;
    expiredEntries: number;
    activeEntries: number;
  } {
    const now = Date.now();
    let expiredCount = 0;
    let activeCount = 0;

    for (const [, value] of this.requestCounts.entries()) {
      if (now > value.resetTime) {
        expiredCount++;
      } else {
        activeCount++;
      }
    }

    return {
      totalEntries: this.requestCounts.size,
      expiredEntries: expiredCount,
      activeEntries: activeCount,
    };
  }

  async checkRateLimit(operation: string): Promise<boolean> {
    const now = Date.now();

    // Periodic cleanup to prevent memory leaks
    if (now - this.lastCleanup > this.cleanupInterval) {
      this.cleanupExpiredEntries();
      this.lastCleanup = now;
    }

    const key = `sanity-${operation}`;

    const current = this.requestCounts.get(key);

    if (!current || now > current.resetTime) {
      this.requestCounts.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (current.count >= this.maxRequestsPerMinute) {
      console.warn(`Rate limit exceeded for ${operation}`);
      return false;
    }

    current.count++;
    return true;
  }

  async executeWithRateLimit<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    if (!(await this.checkRateLimit(operation))) {
      throw new Error(`Rate limit exceeded for ${operation}`);
    }

    return await retrySanityOperation(fn);
  }
}

export const sanityRateLimiter = new SanityRateLimiter();
