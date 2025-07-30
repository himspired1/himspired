import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/client";
import clientPromise from "@/lib/mongodb";

/**
 * Product Stock Endpoint
 *
 * This endpoint calculates accurate stock availability by considering:
 * - Current stock from Sanity
 * - Active reservations from Sanity
 * - Pending orders from MongoDB
 *
 * CRITICAL: MongoDB query failures are rethrown to prevent overselling
 * due to incorrect stock calculations. This ensures data integrity.
 */

type Reservation = {
  sessionId: string;
  quantity: number;
  reservedUntil: string;
};

type StockResponse = {
  success: boolean;
  productId: string;
  title: string;
  stock: number;
  availableStock: number;
  reservedQuantity: number;
  reservedByCurrentUser: number;
  reservedByOthers: number;
  isOutOfStock: boolean;
  stockMessage: string;
  reservations: Reservation[];
};

// In-memory cache for stock data
const stockCache = new Map<
  string,
  { data: StockResponse; timestamp: number }
>();
const CACHE_TTL = 50; 

// Cache cleanup interval (5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;

// Initialize cleanup interval only once
let cleanupInterval: NodeJS.Timeout | null = null;
let cleanupCount = 0;

function initializeCleanupInterval(): void {
  if (cleanupInterval) return; // Already initialized

  cleanupInterval = setInterval(() => {
    const now = Date.now();
    const expiredKeys: string[] = [];

    // Find expired entries
    for (const [key, value] of stockCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        expiredKeys.push(key);
      }
    }

    // Remove expired entries
    for (const key of expiredKeys) {
      stockCache.delete(key);
    }

    // Log cleanup activity if entries were removed
    if (expiredKeys.length > 0) {
      console.log(
        `Stock cache cleanup: removed ${expiredKeys.length} expired entries`
      );
    }

    // Log cache statistics periodically (every 10th cleanup cycle)
    cleanupCount++;
    if (cleanupCount % 10 === 0) {
      const stats = getCacheStats();
      console.log(
        `Stock cache stats: ${stats.size} entries, oldest: ${stats.oldestEntry ? new Date(stats.oldestEntry).toISOString() : "N/A"}`
      );
    }
  }, CLEANUP_INTERVAL);

  console.log("Stock cache cleanup interval initialized");
}

// Initialize cleanup on module load
initializeCleanupInterval();

function cleanupExpiredCache(): number {
  const now = Date.now();
  const expiredKeys: string[] = [];

  // Find expired entries
  for (const [key, value] of stockCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      expiredKeys.push(key);
    }
  }

  // Remove expired entries
  for (const key of expiredKeys) {
    stockCache.delete(key);
  }

  return expiredKeys.length;
}

function getCachedStock(
  productId: string,
  sessionId: string | null
): StockResponse | null {
  const cacheKey = `${productId}-${sessionId || "anonymous"}`;
  const cached = stockCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedStock(
  productId: string,
  sessionId: string | null,
  data: StockResponse
): void {
  const cacheKey = `${productId}-${sessionId || "anonymous"}`;

  // Safety check: if cache gets too large, trigger immediate cleanup
  if (stockCache.size > 1000) {
    const cleanedCount = cleanupExpiredCache();
    console.log(
      `Emergency cache cleanup: removed ${cleanedCount} entries due to size limit`
    );
  }

  stockCache.set(cacheKey, { data, timestamp: Date.now() });
}

// Utility function to get cache statistics (for monitoring)
function getCacheStats(): {
  size: number;
  oldestEntry: number | null;
  newestEntry: number | null;
} {
  if (stockCache.size === 0) {
    return { size: 0, oldestEntry: null, newestEntry: null };
  }

  const timestamps = Array.from(stockCache.values()).map(
    (entry) => entry.timestamp
  );
  return {
    size: stockCache.size,
    oldestEntry: Math.min(...timestamps),
    newestEntry: Math.max(...timestamps),
  };
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await context.params;
    const sessionId = req.nextUrl.searchParams.get("sessionId");
    const clearCache = req.nextUrl.searchParams.get("clearCache") === "true";

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Clear cache if requested
    if (clearCache) {
      console.log(`🧹 Clearing stock cache for product ${productId}`);
      const cacheKeysToRemove: string[] = [];

      for (const [key] of stockCache.entries()) {
        if (key.startsWith(productId)) {
          cacheKeysToRemove.push(key);
        }
      }

      for (const key of cacheKeysToRemove) {
        stockCache.delete(key);
      }

      console.log(
        `✅ Cleared ${cacheKeysToRemove.length} cache entries for product ${productId}`
      );

      // Return a simple success response for cache clearing
      return NextResponse.json({
        success: true,
        message: `Cleared ${cacheKeysToRemove.length} cache entries`,
        productId: productId,
      });
    }

    // Check cache first
    const cached = getCachedStock(productId, sessionId);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Get current stock and reservations from Sanity
    const product = await client.fetch(
      `*[_type == "clothingItem" && _id == $productId][0]{
        _id, title, stock, reservations
      }`,
      { productId }
    );

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Clean up expired reservations
    const now = new Date();
    const reservations: Reservation[] = (product.reservations || []).filter(
      (r: Reservation) => r.reservedUntil && new Date(r.reservedUntil) > now
    );

    // Check for pending orders that contain this product
    // CRITICAL: This query is essential for accurate stock calculation
    // If this fails, we must not continue with incorrect stock data
    let pendingOrderReservedQuantity = 0;
    try {
      const mongoClient = await clientPromise;
      const db = mongoClient.db("himspired");
      const ordersCollection = db.collection("orders");

      // Find pending orders that contain this product
      const pendingOrders = await ordersCollection
        .find({
          status: "payment_pending",
          "items.productId": productId,
        })
        .toArray();

      // Calculate total quantity reserved by pending orders
      pendingOrderReservedQuantity = pendingOrders.reduce((total, order) => {
        const orderItem = order.items.find(
          (item: { productId: string; quantity: number }) =>
            item.productId === productId
        );
        return total + (orderItem ? orderItem.quantity : 0);
      }, 0);
    } catch (error) {
      console.error("Failed to check pending orders:", error);
      // Rethrow the error to prevent continuing with incorrect stock calculations
      // This ensures the failure is propagated and handled upstream
      throw new Error(
        `MongoDB query failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    // Calculate reserved quantity and available stock
    const reservationQuantity = reservations.reduce(
      (sum, r) => sum + (r.quantity || 0),
      0
    );

    // Calculate total reserved quantity, but avoid double-counting
    // If there are reservations and pending orders, we need to be smart about counting
    let totalReservedQuantity =
      reservationQuantity + (pendingOrderReservedQuantity || 0);

    // If we have both reservations and pending orders, we might be double-counting
    // For now, we'll use the maximum of the two to avoid over-counting
    if (reservationQuantity > 0 && pendingOrderReservedQuantity > 0) {
      // Use the larger of the two to avoid double-counting
      totalReservedQuantity = Math.max(
        reservationQuantity,
        pendingOrderReservedQuantity
      );
    }

    // Debug logging to understand the calculation
    console.log(`🔍 Stock calculation debug for ${productId}:`);
    console.log(`  - reservations.length: ${reservations.length}`);
    console.log(`  - reservationQuantity: ${reservationQuantity}`);
    console.log(
      `  - pendingOrderReservedQuantity: ${pendingOrderReservedQuantity}`
    );
    console.log(`  - totalReservedQuantity: ${totalReservedQuantity}`);

    // Validate that we have valid data before calculating stock
    if (typeof product.stock !== "number" || product.stock < 0) {
      throw new Error("Invalid stock data received from database");
    }

    const availableStock = Math.max(0, product.stock - totalReservedQuantity);
    const userReservation = reservations.find((r) => r.sessionId === sessionId);
    const reservedByCurrentUser = userReservation
      ? userReservation.quantity
      : 0;
    const reservedByOthers = totalReservedQuantity - reservedByCurrentUser;

    // Generate stock message
    let stockMessage = "";
    if ((product.stock || 0) <= 0) {
      stockMessage = "Out of Stock";
    } else if (reservedByCurrentUser > 0) {
      stockMessage = `You reserved ${reservedByCurrentUser} item${reservedByCurrentUser > 1 ? "s" : ""}`;
    } else if (availableStock === 0) {
      // When all items are reserved by others, show appropriate message
      if (reservedByOthers >= (product.stock || 0)) {
        stockMessage = "Item reserved by other users";
      } else {
        stockMessage = "Item currently reserved by another customer";
      }
    } else if (availableStock === 1) {
      stockMessage = "Only 1 left!";
    } else if (availableStock <= 3) {
      stockMessage = `Only ${availableStock} left!`;
    } else {
      stockMessage = `${availableStock} in stock`;
    }

    // Calculate actual reservations by others (excluding current user)
    const actualReservations = reservations.filter(
      (r) => r.sessionId !== sessionId
    );
    const actualReservedByOthers = actualReservations.reduce(
      (sum, r) => sum + (r.quantity || 0),
      0
    );

    // Show reserved by others if there are actual reservations
    if (actualReservedByOthers > 0 && availableStock > 0) {
      stockMessage += `, ${actualReservedByOthers} currently reserved by others`;
    }

    // Add information about pending orders if any
    // Show pending orders info if there are pending orders
    // This helps users understand why stock might be lower than expected
    if (pendingOrderReservedQuantity > 0) {
      stockMessage += ` (${pendingOrderReservedQuantity} in pending orders)`;
    }

    const response: StockResponse = {
      success: true,
      productId: product._id,
      title: product.title,
      stock: product.stock || 0,
      availableStock: availableStock,
      reservedQuantity: totalReservedQuantity,
      reservedByCurrentUser,
      reservedByOthers,
      isOutOfStock: availableStock <= 0,
      stockMessage: stockMessage,
      reservations,
    };

    // Cache the response
    setCachedStock(productId, sessionId, response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Stock fetch error:", error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("MongoDB query failed")) {
        return NextResponse.json(
          {
            error: "Database connection error",
            message:
              "Unable to verify stock availability due to database issues. Please try again.",
          },
          { status: 503 }
        );
      }
      if (error.message.includes("Product not found")) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Failed to fetch stock information",
        message:
          "An unexpected error occurred while calculating stock availability.",
      },
      { status: 500 }
    );
  }
}
