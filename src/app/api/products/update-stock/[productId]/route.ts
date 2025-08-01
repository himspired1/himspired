import { NextRequest, NextResponse } from "next/server";
import { StockAuth } from "@/lib/stock-auth";
import { cacheService } from "@/lib/cache-service";

// Simple rate limiting for stock update operations
const stockUpdateAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_STOCK_UPDATE_ATTEMPTS = 10;
const WINDOW_MS = 60 * 1000; // 1 minute

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

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
    // Simple rate limiting for sensitive stock operations
    const clientIp = getClientIp(req);
    const now = Date.now();
    let entry = stockUpdateAttempts.get(clientIp);
    
    if (!entry || now - entry.firstAttempt > WINDOW_MS) {
      entry = { count: 0, firstAttempt: now };
    }
    
    entry.count++;
    stockUpdateAttempts.set(clientIp, entry);
    
    if (entry.count > MAX_STOCK_UPDATE_ATTEMPTS) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: "Too many stock update attempts. Please try again later.",
        },
        { status: 429 }
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

    // Clear related caches after stock update
    try {
      // OPTIMIZATION: Batch cache invalidation instead of multiple calls
      await Promise.all([
        cacheService.clearStockCache(productId),
        cacheService.clearProductCache(productId),
        cacheService.clearReservationCache(productId),
      ]);

      console.log(`✅ Stock cache cleared for product ${productId}`);
    } catch (error) {
      console.warn("Failed to clear stock caches:", error);
    }

    // OPTIMIZATION: Reduce cache invalidation frequency
    // Only trigger broadcast if stock changed significantly
    if (Math.abs(currentStock - newStock) > 0) {
      try {
        // OPTIMIZATION: Use internal cache clearing instead of external API call
        await Promise.all([
          cacheService.clearStockCache(productId),
          cacheService.clearProductCache(productId),
          cacheService.clearReservationCache(productId)
        ]);
        
        console.log(`📢 Broadcasting stock update for product ${productId}`);
      } catch (error) {
        console.warn("Failed to broadcast stock update:", error);
      }
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
