import { NextRequest, NextResponse } from "next/server";
import { writeClient } from "@/sanity/client";
import { StockAuth } from "@/lib/stock-auth";
import { RateLimiter } from "@/lib/rate-limiter";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  const { productId } = await context.params;

  try {
    // Apply rate limiting for sensitive stock operations
    const rateLimitMiddleware = RateLimiter.middleware({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 requests per minute
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
          message: "Valid token required to update stock",
        },
        { status: 401 }
      );
    }

    const { newStock } = await req.json();

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    if (typeof newStock !== "number" || newStock < 0) {
      return NextResponse.json(
        { error: "Valid new stock value is required" },
        { status: 400 }
      );
    }

    try {
      // Get current stock for comparison
      const currentProduct = await writeClient.fetch(
        `*[_type == "clothingItem" && _id == $productId][0]{ stock }`,
        { productId }
      );

      if (!currentProduct) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      const currentStock = currentProduct.stock || 0;
      console.log(
        `🔄 Updating stock for product ${productId}: ${currentStock} -> ${newStock}`
      );

      // Direct patch without transaction
      await writeClient.patch(productId).set({ stock: newStock }).commit();

      console.log(`✅ Stock updated to ${newStock} for product ${productId}`);

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
          console.warn(
            `⚠️ Failed to clear stock cache for product ${productId}`
          );
        }
      } catch (cacheError) {
        console.warn(`⚠️ Error clearing stock cache:`, cacheError);
      }

      // Trigger stock update notification to all connected clients
      try {
        console.log(`📢 Broadcasting stock update for product ${productId}`);

        // Trigger the stock update notification endpoint
        const triggerResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/products/trigger-stock-update/${productId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${StockAuth.getValidTokens()[0]}`,
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
        previousStock: currentStock,
        newStock: newStock,
        productId: productId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Stock update error for product ${productId}:`, error);
      return NextResponse.json(
        { error: "Failed to update stock" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(`Stock update error for product ${productId}:`, error);
    return NextResponse.json(
      { error: "Failed to update stock" },
      { status: 500 }
    );
  }
}
