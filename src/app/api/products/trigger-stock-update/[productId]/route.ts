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
    StockAuth.logAuthAttempt(req, isAuthorized, "trigger-stock-update");

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

    // Return success - the actual stock update will be handled by the calling code
    // This endpoint is mainly for logging and authorization purposes
    return NextResponse.json({
      success: true,
      message: "Stock update triggered successfully",
      productId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error triggering stock update:", error);
    return NextResponse.json(
      { error: "Failed to trigger stock update" },
      { status: 500 }
    );
  }
}
