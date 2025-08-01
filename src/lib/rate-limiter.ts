import { NextRequest, NextResponse } from "next/server";

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

  constructor(
    private readonly maxAttempts: number,
    private readonly windowMs: number,
    private readonly identifier: string = "default"
  ) {
    // Start periodic cleanup
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  isAllowed(key: string): boolean {
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

  getStats(): { totalEntries: number; identifier: string } {
    return {
      totalEntries: this.limits.size,
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
