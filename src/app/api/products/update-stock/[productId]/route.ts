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

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  const { productId } = await context.params;

  try {
    // Apply rate limiting for sensitive stock operations
    const rateLimitResult = RateLimiter.checkRateLimitForAPI(req, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 requests per minute
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
          message: "Valid token required to modify stock",
        },
        { status: 401 }
      );
    }

    // Validate that we have valid tokens
    if (!StockAuth.hasValidTokens()) {
      return NextResponse.json(
        {
          error: "Configuration error",
          message: "No valid stock modification tokens available",
        },
        { status: 500 }
      );
    }

    const { newStock } = await req.json();

    if (typeof newStock !== "number" || newStock < 0) {
      return NextResponse.json(
        {
          error: "Invalid stock value",
          message: "newStock must be a non-negative number",
        },
        { status: 400 }
      );
    }

    // Get current stock for comparison
    const currentStockResponse = await fetch(
      `${getBaseUrl()}/api/products/stock/${productId}?sessionId=update-check`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    let currentStock = 0;
    if (currentStockResponse.ok) {
      const stockData = await currentStockResponse.json();
      currentStock = stockData.stock || 0;
    }

    console.log(`📊 Stock update for product ${productId}:`);
    console.log(`   - Current stock: ${currentStock}`);
    console.log(`   - New stock: ${newStock}`);

    // Update stock in Sanity
    const { writeClient } = await import("@/sanity/client");
    const { client } = await import("@/sanity/client");

    // Get current product data
    const product = await client.fetch(
      `*[_type == "clothingItem" && _id == $productId][0]{
        _id, _rev, title, stock
      }`,
      { productId }
    );

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Update stock using optimistic locking
    await writeClient
      .patch(productId)
      .ifRevisionId(product._rev)
      .set({
        stock: newStock,
      })
      .commit();

    console.log(`✅ Stock updated successfully for product ${productId}`);

    // Clear stock cache for this product
    try {
      console.log(`🧹 Clearing stock cache for product ${productId}`);
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

    // Trigger stock update notification to all connected clients
    try {
      console.log(`📢 Broadcasting stock update for product ${productId}`);

      // Safely get the first valid token with proper error handling
      let authToken: string;
      try {
        authToken = StockAuth.getFirstValidToken();
      } catch (tokenError) {
        console.error(
          `❌ Error getting valid token for stock update broadcast:`,
          tokenError
        );
        console.warn(
          `⚠️ Skipping stock update broadcast due to token unavailability`
        );
        // Continue without broadcasting - the stock update was successful
        return NextResponse.json({
          success: true,
          message:
            "Stock updated successfully (broadcast skipped due to token unavailability)",
          productId,
          previousStock: currentStock,
          newStock,
          productTitle: product.title,
        });
      }

      // Trigger the stock update notification endpoint
      const triggerResponse = await fetch(
        `${getBaseUrl()}/api/products/trigger-stock-update/${productId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (triggerResponse.ok) {
        console.log(`✅ Stock update broadcast triggered successfully`);
      } else {
        console.warn(
          `⚠️ Stock update broadcast failed: ${await triggerResponse.text()}`
        );
      }
    } catch (broadcastError) {
      console.error(`Error broadcasting stock update:`, broadcastError);
    }

    return NextResponse.json({
      success: true,
      message: "Stock updated successfully",
      productId,
      previousStock: currentStock,
      newStock,
      productTitle: product.title,
    });
  } catch (error) {
    console.error(`Stock update error for product ${productId}:`, error);
    return NextResponse.json(
      {
        error: "Failed to update stock",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
