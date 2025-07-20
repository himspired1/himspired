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
 */
export class SanityRateLimiter {
  private requestCounts = new Map<
    string,
    { count: number; resetTime: number }
  >();
  private readonly maxRequestsPerMinute = 900; // Conservative limit
  private readonly windowMs = 60000; // 1 minute

  async checkRateLimit(operation: string): Promise<boolean> {
    const now = Date.now();
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
