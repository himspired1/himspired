import { NextRequest, NextResponse } from "next/server";
import { StockAuth } from "@/lib/stock-auth";
import { forceCleanupProducts } from "@/lib/product-cleanup";
import { rateLimiter } from "@/lib/rate-limiter";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

interface ForceCleanupRequest {
  productIds: string[];
  clearAll?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting for sensitive cleanup operations
    const clientIp = getClientIp(req);

    const rateLimitResult = await rateLimiter.checkRateLimit(clientIp, {
      maxAttempts: 5,
      windowMs: 60 * 1000, // 1 minute
      keyPrefix: "rate_limit:admin_cleanup",
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
          message: "Valid token required to perform force cleanup",
        },
        { status: 401 }
      );
    }

    const { productIds, clearAll = true }: ForceCleanupRequest =
      await req.json();

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "productIds array is required and must not be empty",
        },
        { status: 400 }
      );
    }

    // Validate all product IDs
    for (const productId of productIds) {
      if (typeof productId !== "string" || productId.trim().length === 0) {
        return NextResponse.json(
          {
            error: "Invalid product ID",
            message: "All product IDs must be non-empty strings",
          },
          { status: 400 }
        );
      }
    }

    // Use the shared function instead of making HTTP requests
    const result = await forceCleanupProducts(productIds, clearAll);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Force cleanup API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to perform force cleanup",
      },
      { status: 500 }
    );
  }
}
