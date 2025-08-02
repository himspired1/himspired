import { NextRequest, NextResponse } from "next/server";
import { StockAuth } from "@/lib/stock-auth";
import { forceCleanupProduct } from "@/lib/product-cleanup";
import { rateLimiter } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/request-utils";

/**
 * Force Cleanup Reservations Endpoint
 *
 * This endpoint forcefully cleans up all reservations for a specific product.
 * It's used when reservations are stuck and need manual intervention.
 *
 * Usage: POST /api/products/force-cleanup/[productId]
 * Body: { sessionId?: string, clearAll?: boolean }
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  const { productId } = await context.params;

  try {
    // Rate limiting for sensitive cleanup operations
    const clientIp = getClientIp(req);

    const rateLimitResult = await rateLimiter.checkRateLimit(clientIp, {
      maxAttempts: 5,
      windowMs: 60 * 1000, // 1 minute
      keyPrefix: "rate_limit:product_cleanup",
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: "Too many cleanup attempts. Please try again later.",
          resetTime: rateLimitResult.resetTime,
          remaining: rateLimitResult.remaining,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    // Validate environment variables
    StockAuth.validateEnvironmentVariables();

    // Use timing-safe authentication
    const isAuthorized = await StockAuth.isAuthorized(req);
    if (!isAuthorized) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Valid token required to force cleanup reservations",
        },
        { status: 401 }
      );
    }

    // Parse request body with error handling
    let requestBody: { sessionId?: string; clearAll?: boolean };
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      return NextResponse.json(
        {
          error: "Invalid JSON in request body",
          message: "Request body must be valid JSON",
        },
        { status: 400 }
      );
    }

    const { sessionId, clearAll = false } = requestBody;

    // Use the shared function instead of duplicating logic
    const result = await forceCleanupProduct({
      productId,
      sessionId,
      clearAll,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        productId: result.productId,
        originalCount: result.originalCount,
        clearedCount: result.clearedCount,
        remainingCount: result.remainingCount,
        productTitle: result.productTitle,
      });
    } else {
      return NextResponse.json(
        {
          error: result.error || "Force cleanup failed",
          message: result.message,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error(`Force cleanup error for product ${productId}:`, error);
    return NextResponse.json(
      { error: "Failed to force cleanup reservations" },
      { status: 500 }
    );
  }
}
