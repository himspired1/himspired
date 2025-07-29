import { NextRequest } from "next/server";

export interface SessionInfo {
  sessionId: string;
  isValid: boolean;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  lastActivity?: Date;
}

export interface RateLimitInfo {
  isAllowed: boolean;
  remainingRequests: number;
  resetTime: Date;
  limit: number;
}

export class SessionValidator {
  private static readonly SESSION_EXPIRY = 30 * 60 * 1000; // 30 minutes
  private static readonly RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_REQUESTS_PER_SESSION = 10; // 10 requests per 5 minutes
  private static readonly MAX_REQUESTS_PER_IP = 50; // 50 requests per 5 minutes

  // In-memory rate limiting (in production, use Redis or similar)
  private static sessionRateLimits = new Map<
    string,
    { count: number; resetTime: Date }
  >();
  private static ipRateLimits = new Map<
    string,
    { count: number; resetTime: Date }
  >();

  // Periodic cleanup timer
  private static cleanupTimer: NodeJS.Timeout | null = null;
  private static readonly CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
  private static cleanupCounter = 0; // Counter for periodic cleanup

  // Initialize cleanup timer on module load
  static {
    this.initializeCleanupTimer();
  }

  /**
   * Validate a session ID and extract session information
   * @param sessionId - The session ID to validate
   * @param request - The NextRequest object
   * @returns Promise<SessionInfo> - Session validation result
   */
  static async validateSession(
    sessionId: string,
    request: NextRequest
  ): Promise<SessionInfo> {
    const ipAddress = this.getClientIp(request);
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Basic session ID format validation
    if (!sessionId || typeof sessionId !== "string") {
      return {
        sessionId: sessionId || "unknown",
        isValid: false,
        ipAddress,
        userAgent,
      };
    }

    // Check session ID format (should match SessionManager format)
    const sessionPattern = /^session_\d+_[a-z0-9]+$/;
    if (!sessionPattern.test(sessionId)) {
      return {
        sessionId,
        isValid: false,
        ipAddress,
        userAgent,
      };
    }

    // Extract timestamp from session ID
    const timestampMatch = sessionId.match(/session_(\d+)_/);
    if (!timestampMatch) {
      return {
        sessionId,
        isValid: false,
        ipAddress,
        userAgent,
      };
    }

    const sessionTimestamp = parseInt(timestampMatch[1]);
    const now = Date.now();
    const sessionAge = now - sessionTimestamp;

    // Check if session is expired
    if (sessionAge > this.SESSION_EXPIRY) {
      return {
        sessionId,
        isValid: false,
        ipAddress,
        userAgent,
        lastActivity: new Date(sessionTimestamp),
      };
    }

    return {
      sessionId,
      isValid: true,
      ipAddress,
      userAgent,
      lastActivity: new Date(sessionTimestamp),
    };
  }

  /**
   * Check rate limiting for a session
   * @param sessionId - The session ID
   * @param ipAddress - The IP address
   * @returns RateLimitInfo - Rate limiting information
   */
  static checkRateLimit(sessionId: string, ipAddress: string): RateLimitInfo {
    const now = new Date();

    // Clean up expired rate limits periodically (every 10th call)
    this.cleanupCounter++;
    if (this.cleanupCounter % 10 === 0) {
      this.cleanupExpiredRateLimits();
    }

    // Check session-based rate limiting
    const sessionLimit = this.sessionRateLimits.get(sessionId);
    if (!sessionLimit || now > sessionLimit.resetTime) {
      this.sessionRateLimits.set(sessionId, {
        count: 1,
        resetTime: new Date(now.getTime() + this.RATE_LIMIT_WINDOW),
      });
    } else {
      sessionLimit.count++;
    }

    // Check IP-based rate limiting
    const ipLimit = this.ipRateLimits.get(ipAddress);
    if (!ipLimit || now > ipLimit.resetTime) {
      this.ipRateLimits.set(ipAddress, {
        count: 1,
        resetTime: new Date(now.getTime() + this.RATE_LIMIT_WINDOW),
      });
    } else {
      ipLimit.count++;
    }

    const sessionInfo = this.sessionRateLimits.get(sessionId);
    const ipInfo = this.ipRateLimits.get(ipAddress);

    const sessionAllowed =
      !sessionInfo || sessionInfo.count <= this.MAX_REQUESTS_PER_SESSION;
    const ipAllowed = !ipInfo || ipInfo.count <= this.MAX_REQUESTS_PER_IP;

    return {
      isAllowed: sessionAllowed && ipAllowed,
      remainingRequests: Math.min(
        sessionAllowed
          ? this.MAX_REQUESTS_PER_SESSION - (sessionInfo?.count || 0)
          : 0,
        ipAllowed ? this.MAX_REQUESTS_PER_IP - (ipInfo?.count || 0) : 0
      ),
      resetTime: sessionInfo?.resetTime || ipInfo?.resetTime || now,
      limit: Math.min(this.MAX_REQUESTS_PER_SESSION, this.MAX_REQUESTS_PER_IP),
    };
  }

  /**
   * Get client IP address from request
   * @param request - The NextRequest object
   * @returns string - The client IP address
   */
  private static getClientIp(request: NextRequest): string {
    return (
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      request.headers.get("x-client-ip") ||
      "unknown"
    );
  }

  /**
   * Log session validation attempt for audit purposes
   * @param sessionInfo - Session validation result
   * @param rateLimitInfo - Rate limiting information
   * @param action - The action being performed
   */
  static logSessionValidation(
    sessionInfo: SessionInfo,
    rateLimitInfo: RateLimitInfo,
    action: string
  ): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      action,
      sessionId: sessionInfo.sessionId,
      isValid: sessionInfo.isValid,
      ipAddress: sessionInfo.ipAddress,
      userAgent: sessionInfo.userAgent,
      rateLimitAllowed: rateLimitInfo.isAllowed,
      remainingRequests: rateLimitInfo.remainingRequests,
      resetTime: rateLimitInfo.resetTime.toISOString(),
    };

    if (sessionInfo.isValid && rateLimitInfo.isAllowed) {
      console.log(
        `🔐 SESSION VALIDATION SUCCESS:`,
        JSON.stringify(logEntry, null, 2)
      );
    } else {
      console.warn(
        `🚫 SESSION VALIDATION FAILED:`,
        JSON.stringify(logEntry, null, 2)
      );
    }
  }

  /**
   * Initialize periodic cleanup timer
   */
  private static initializeCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredRateLimits();
      console.log(
        `Rate limit cleanup: cleaned up expired entries at ${new Date().toISOString()}`
      );
    }, this.CLEANUP_INTERVAL);

    console.log(
      `Rate limit cleanup timer initialized with ${this.CLEANUP_INTERVAL / 1000 / 60} minute intervals`
    );
  }

  /**
   * Clean up expired rate limit entries
   */
  static cleanupExpiredRateLimits(): void {
    const now = new Date();
    let cleanedCount = 0;

    // Clean up session rate limits
    for (const [sessionId, info] of this.sessionRateLimits.entries()) {
      if (now > info.resetTime) {
        this.sessionRateLimits.delete(sessionId);
        cleanedCount++;
      }
    }

    // Clean up IP rate limits
    for (const [ip, info] of this.ipRateLimits.entries()) {
      if (now > info.resetTime) {
        this.ipRateLimits.delete(ip);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(
        `Rate limit cleanup: removed ${cleanedCount} expired entries`
      );
    }
  }
}
