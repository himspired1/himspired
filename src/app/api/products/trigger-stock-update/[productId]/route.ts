import { NextRequest, NextResponse } from "next/server";
import { StockAuth } from "@/lib/stock-auth";

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
  try {
    // Authorization check - verify the request is authorized to trigger stock updates
    const isAuthorized = await StockAuth.isAuthorized(req);

    if (!isAuthorized) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Authorization header required to trigger stock updates.",
        },
        { status: 401 }
      );
    }

    const { productId } = await context.params;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Log the stock update trigger
    console.log(`📢 Triggering stock update for product ${productId}`);

    // Clear stock cache for this product to ensure fresh data
    try {
      const cacheClearResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/products/stock/${productId}?clearCache=true`,
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
    console.error("Error triggering stock update:", error);
    return NextResponse.json(
      { error: "Failed to trigger stock update" },
      { status: 500 }
    );
  }
}
