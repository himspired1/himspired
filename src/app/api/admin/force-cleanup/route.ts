import { NextRequest, NextResponse } from "next/server";
import { AdminAuth } from "@/lib/admin-auth";
import { cacheService } from "@/lib/cache-service";
import { rateLimiter, RATE_LIMIT_CONFIGS } from "@/lib/rate-limiter";

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await AdminAuth.verifyAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check rate limit
    const clientIp =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const rateLimitResult = await rateLimiter.checkRateLimit(
      clientIp,
      RATE_LIMIT_CONFIGS.API_GENERAL
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          resetTime: rateLimitResult.resetTime,
          remaining: rateLimitResult.remaining,
        },
        { status: 429 }
      );
    }

    // Clear all caches
    await cacheService.invalidateAllCaches();

    return NextResponse.json({
      success: true,
      message: "All caches cleared successfully",
      cleared: [
        "analytics",
        "stock",
        "orders",
        "products",
        "delivery_fees",
        "rate_limits",
        "sessions",
        "reservations",
      ],
    });
  } catch (error) {
    console.error("Force cleanup error:", error);
    return NextResponse.json(
      { error: "Failed to clear caches" },
      { status: 500 }
    );
  }
}
