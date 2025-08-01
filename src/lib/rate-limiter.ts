// Rate limiter utilities

/**
 * Centralized rate limiter with memory management
 * Handles cleanup and prevents memory leaks
 */

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lastCleanup: number;
}

export class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private readonly maxEntries = 10000; // Prevent unlimited growth
  private readonly cleanupInterval = 5 * 60 * 1000; // 5 minutes
  private lastGlobalCleanup = Date.now();
  private cleanupTimerId: NodeJS.Timeout | null = null;
  private readonly lock = new Map<string, Promise<void>>(); // Per-key locking mechanism

  constructor(
    private readonly maxAttempts: number,
    private readonly windowMs: number,
    private readonly identifier: string = "default"
  ) {
    // Start periodic cleanup and store the timer ID
    this.cleanupTimerId = setInterval(
      () => this.cleanup(),
      this.cleanupInterval
    );
  }

  /**
   * Atomic rate limit check with proper synchronization
   * Prevents race conditions by using per-key locking
   */
  async isAllowed(key: string): Promise<boolean> {
    // Wait for any existing operation on this key to complete
    const existingLock = this.lock.get(key);
    if (existingLock) {
      await existingLock;
    }

    // Create a new lock for this operation
    let resolveLock: () => void;
    const operationLock = new Promise<void>((resolve) => {
      resolveLock = resolve;
    });
    this.lock.set(key, operationLock);

    try {
      return await this.performAtomicCheck(key);
    } finally {
      // Always release the lock
      this.lock.delete(key);
      resolveLock!();
    }
  }

  /**
   * Synchronous version for backward compatibility
   * Note: This version may have race conditions in high-concurrency scenarios
   * Use the async version for better reliability
   */
  isAllowedSync(key: string): boolean {
    const now = Date.now();
    let entry = this.limits.get(key);

    // Clean up expired entries
    if (entry && now - entry.firstAttempt > this.windowMs) {
      this.limits.delete(key);
      entry = undefined;
    }

    // Create new entry if needed
    if (!entry) {
      entry = {
        count: 0,
        firstAttempt: now,
        lastCleanup: now,
      };
    }

    // Check if limit exceeded
    if (entry.count >= this.maxAttempts) {
      return false;
    }

    // Increment count
    entry.count++;
    this.limits.set(key, entry);

    // Emergency cleanup if too many entries
    if (this.limits.size > this.maxEntries) {
      this.emergencyCleanup();
    }

    return true;
  }

  /**
   * Perform atomic rate limit check with proper synchronization
   */
  private async performAtomicCheck(key: string): Promise<boolean> {
    const now = Date.now();
    let entry = this.limits.get(key);

    // Clean up expired entries
    if (entry && now - entry.firstAttempt > this.windowMs) {
      this.limits.delete(key);
      entry = undefined;
    }

    // Create new entry if needed
    if (!entry) {
      entry = {
        count: 0,
        firstAttempt: now,
        lastCleanup: now,
      };
    }

    // Check if limit exceeded
    if (entry.count >= this.maxAttempts) {
      return false;
    }

    // Emergency cleanup check BEFORE setting the entry to prevent exceeding maxEntries
    if (this.limits.size >= this.maxEntries) {
      this.emergencyCleanup();
    }

    // Atomic increment and set
    entry.count++;
    this.limits.set(key, entry);

    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;
    const initialSize = this.limits.size;

    for (const [key, entry] of Array.from(this.limits.entries())) {
      if (now - entry.firstAttempt > this.windowMs) {
        this.limits.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(
        `🧹 Rate limiter cleanup: removed ${cleanedCount} expired entries (${initialSize} → ${this.limits.size})`
      );
    }
  }

  private emergencyCleanup(): void {
    console.warn(
      `🚨 Emergency rate limiter cleanup triggered (${this.limits.size} entries)`
    );

    // Remove oldest 50% of entries
    const entries = Array.from(this.limits.entries());
    entries.sort((a, b) => a[1].firstAttempt - b[1].firstAttempt);

    const toRemove = entries.slice(0, Math.floor(entries.length / 2));
    toRemove.forEach(([key]) => this.limits.delete(key));

    console.log(
      `✅ Emergency cleanup completed: ${this.limits.size} entries remaining`
    );
  }

  /**
   * Clean up the rate limiter instance
   * Call this method when the instance is no longer needed to prevent memory leaks
   */
  destroy(): void {
    if (this.cleanupTimerId) {
      clearInterval(this.cleanupTimerId);
      this.cleanupTimerId = null;
      console.log(`🧹 Rate limiter destroyed for ${this.identifier}`);
    }
  }

  getStats(): { totalEntries: number; identifier: string } {
    return {
      totalEntries: this.limits.size,
      identifier: this.identifier,
    };
  }
}

/**
 * Simple rate limiter for basic rate limiting needs
 * Uses the same pattern as inline rate limiting but encapsulated in a class
 */
export class SimpleRateLimiter {
  private attempts = new Map<string, { count: number; firstAttempt: number }>();
  private readonly lock = new Map<string, Promise<void>>(); // Per-key locking mechanism

  constructor(
    private readonly maxAttempts: number,
    private readonly windowMs: number,
    private readonly identifier: string = "simple"
  ) {}

  /**
   * Atomic rate limit check with proper synchronization
   * Prevents race conditions by using per-key locking
   */
  async checkLimit(key: string): Promise<boolean> {
    // Wait for any existing operation on this key to complete
    const existingLock = this.lock.get(key);
    if (existingLock) {
      await existingLock;
    }

    // Create a new lock for this operation
    let resolveLock: () => void;
    const operationLock = new Promise<void>((resolve) => {
      resolveLock = resolve;
    });
    this.lock.set(key, operationLock);

    try {
      return await this.performAtomicCheck(key);
    } finally {
      // Always release the lock
      this.lock.delete(key);
      resolveLock!();
    }
  }

  /**
   * Synchronous version for backward compatibility
   * Note: This version may have race conditions in high-concurrency scenarios
   * Use the async version for better reliability
   */
  checkLimitSync(key: string): boolean {
    const now = Date.now();
    let entry = this.attempts.get(key);

    if (!entry || now - entry.firstAttempt > this.windowMs) {
      entry = { count: 0, firstAttempt: now };
    }

    entry.count++;
    this.attempts.set(key, entry);

    return entry.count <= this.maxAttempts;
  }

  /**
   * Perform atomic rate limit check with proper synchronization
   */
  private async performAtomicCheck(key: string): Promise<boolean> {
    const now = Date.now();
    let entry = this.attempts.get(key);

    if (!entry || now - entry.firstAttempt > this.windowMs) {
      entry = { count: 0, firstAttempt: now };
    }

    // Atomic increment and set
    entry.count++;
    this.attempts.set(key, entry);

    return entry.count <= this.maxAttempts;
  }

  /**
   * Clean up the simple rate limiter instance
   * Clears all stored attempts to free memory
   */
  destroy(): void {
    this.attempts.clear();
    console.log(`🧹 Simple rate limiter destroyed for ${this.identifier}`);
  }

  getStats(): { totalEntries: number; identifier: string } {
    return {
      totalEntries: this.attempts.size,
      identifier: this.identifier,
    };
  }
}

// Pre-configured rate limiters
export const orderRateLimiter = new RateLimiter(3, 30 * 60 * 1000, "orders"); // 3 orders per 30 min
export const adminRateLimiter = new RateLimiter(5, 10 * 60 * 1000, "admin"); // 5 attempts per 10 min
export const newsletterRateLimiter = new RateLimiter(
  3,
  30 * 60 * 1000,
  "newsletter"
); // 3 subs per 30 min
