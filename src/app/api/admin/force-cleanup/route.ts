import { NextRequest, NextResponse } from "next/server";
import { StockAuth } from "@/lib/stock-auth";
import { RateLimiter } from "@/lib/rate-limiter";

interface ForceCleanupRequest {
  productIds: string[];
  clearAll?: boolean;
}

interface ForceCleanupResult {
  success: boolean;
  productId: string;
  message: string;
}

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting for sensitive cleanup operations
    const rateLimitMiddleware = RateLimiter.middleware({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5, // 5 requests per minute (very restrictive for cleanup)
    });

    const rateLimitResponse = await rateLimitMiddleware(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
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

    const results: ForceCleanupResult[] = [];

    // Perform force cleanup for each product
    for (const productId of productIds) {
      try {
        // Extract base product ID from order product ID (remove size and timestamp metadata)
        const baseProductId = productId.split(":::")[0];

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/products/force-cleanup/${baseProductId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${StockAuth.getValidTokens()[0]}`,
            },
            body: JSON.stringify({
              clearAll: clearAll,
            }),
          }
        );

        if (response.ok) {
          const result = await response.json();
          results.push({
            success: true,
            productId: baseProductId,
            message: `Force cleanup completed successfully`,
          });
          console.log(
            `✅ Force cleanup completed for ${baseProductId}:`,
            result
          );
        } else {
          const errorText = await response.text();
          results.push({
            success: false,
            productId: baseProductId,
            message: `Force cleanup failed: ${errorText}`,
          });
          console.error(
            `❌ Force cleanup failed for ${baseProductId}:`,
            errorText
          );
        }
      } catch (error) {
        results.push({
          success: false,
          productId: productId,
          message: `Error during force cleanup: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
        console.error(`❌ Error during force cleanup for ${productId}:`, error);
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: failureCount === 0,
      message: `Force cleanup completed: ${successCount} successful, ${failureCount} failed`,
      results: results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
      },
    });
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
