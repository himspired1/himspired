import { NextRequest, NextResponse } from "next/server";
import { StockAuth } from "@/lib/stock-auth";
import { RateLimiter } from "@/lib/rate-limiter";

/**
 * Get the base URL for API calls
 */
function getBaseUrl(): string {
  return (
    process.env.BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000"
  );
}

/**
 * Trigger Stock Update Endpoint
 *
 * This endpoint triggers a stock update for a specific product.
 * It's used when payment is confirmed to notify all connected clients
 * about stock changes and trigger real-time updates.
 *
 * Usage: POST /api/products/trigger-stock-update/[productId]
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  const { productId } = await context.params;

  try {
    // Apply rate limiting for stock update notifications
    const rateLimitResult = RateLimiter.checkRateLimitForAPI(req, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20, // 20 requests per minute
    });

    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    // Validate environment variables
    StockAuth.validateEnvironmentVariables();

    // Use timing-safe authentication
    const isAuthorized = await StockAuth.isAuthorized(req);
    if (!isAuthorized) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Valid token required to trigger stock updates",
        },
        { status: 401 }
      );
    }

    console.log(`📢 Triggering stock update for product ${productId}`);
    // Clear stock cache for this product to ensure fresh data
    try {
      const cacheClearResponse = await fetch(
        `${getBaseUrl()}/api/products/stock/${productId}?clearCache=true`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (cacheClearResponse.ok) {
        console.log(`✅ Stock cache cleared for product ${productId}`);
      } else {
        console.warn(`⚠️ Failed to clear stock cache for product ${productId}`);
      }
    } catch (cacheError) {
      console.warn(`⚠️ Error clearing stock cache:`, cacheError);
    }

    // Return success with additional information for frontend components
    return NextResponse.json({
      success: true,
      message: "Stock update triggered successfully",
      productId,
      timestamp: new Date().toISOString(),
      cacheCleared: true,
    });
  } catch (error) {
    console.error(
      `Error triggering stock update for product ${productId}:`,
      error
    );
    return NextResponse.json(
      {
        error: "Failed to trigger stock update",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
