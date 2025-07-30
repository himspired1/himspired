import { NextRequest, NextResponse } from "next/server";
import { StockAuth } from "@/lib/stock-auth";
import { RateLimiter } from "@/lib/rate-limiter";
import { forceCleanupProducts } from "@/lib/product-cleanup";

interface ForceCleanupRequest {
  productIds: string[];
  clearAll?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting for sensitive cleanup operations
    const rateLimitResult = RateLimiter.checkRateLimitForAPI(req, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5, // 5 requests per minute (very restrictive for cleanup)
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
