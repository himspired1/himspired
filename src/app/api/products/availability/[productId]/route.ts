import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/client";
import clientPromise from "@/lib/mongodb";
import { cacheService } from "@/lib/cache-service";
import { rateLimiter, RATE_LIMIT_CONFIGS } from "@/lib/rate-limiter";

function normalizeIP(req: NextRequest): string {
  // Only use X-Forwarded-For if TRUSTED_PROXY is enabled
  if (process.env.TRUSTED_PROXY === 'true') {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
      const ip = forwarded.split(',')[0].trim();
      return ip || 'unknown-ip';
    }
    const realIP = req.headers.get('x-real-ip');
    if (realIP) {
      return realIP.trim();
    }
  }
  
  // For serverless platforms, try to get client IP from request
  // This is platform-specific and may need adjustment based on deployment
  const clientIP = req.headers.get('cf-connecting-ip') || // Cloudflare
                   req.headers.get('x-client-ip') ||       // General
                   req.headers.get('x-cluster-client-ip'); // Cluster
  
  return clientIP?.trim() || 'unknown-ip';
}

function validateSessionId(sessionId: string | null): boolean {
  if (!sessionId) return false;
  // Validate against strict pattern: 24-32 hex characters (MongoDB ObjectId or similar)
  return /^[a-f0-9]{24,32}$/i.test(sessionId);
}

function createRateLimitKey(ip: string, sessionId: string | null): string {
  const normalizedIP = ip;
  if (sessionId && validateSessionId(sessionId)) {
    return `${normalizedIP}:${sessionId}`;
  }
  return normalizedIP;
}

type Reservation = {
  sessionId: string;
  quantity: number;
  reservedUntil: string;
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await context.params;
    const sessionId = req.nextUrl.searchParams.get("sessionId");

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Rate limiting: Use trusted IP as primary key, validated sessionId as secondary
    const clientIP = normalizeIP(req);
    const clientKey = createRateLimitKey(clientIP, sessionId);
    const rateLimitResult = await rateLimiter.checkRateLimit(
      clientKey,
      RATE_LIMIT_CONFIGS.AVAILABILITY_CHECKS
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: "Too many requests", 
          message: "Please wait before checking availability again",
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': RATE_LIMIT_CONFIGS.AVAILABILITY_CHECKS.maxAttempts.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          }
        }
      );
    }

    // OPTIMIZATION: Try to get from cache first
    const cacheKey = `availability:${productId}:${sessionId || "anonymous"}`;
    try {
      const cached = await cacheService.getProductCache(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
    } catch (error) {
      console.warn("Availability cache get failed:", error);
    }

    // Get product stock and reservations from Sanity
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
    const allReservations: Reservation[] = (product.reservations || []).filter(
      (r: Reservation) => r.reservedUntil && new Date(r.reservedUntil) > now
    );

    // Aggregate reservations by sessionId to handle duplicates
    const aggregatedReservations = new Map<string, number>();
    allReservations.forEach((reservation) => {
      const currentQuantity =
        aggregatedReservations.get(reservation.sessionId) || 0;
      aggregatedReservations.set(
        reservation.sessionId,
        currentQuantity + (reservation.quantity || 0)
      );
    });

    // Convert back to reservation format for consistency
    const reservations: Reservation[] = Array.from(
      aggregatedReservations.entries()
    ).map(([sessionId, quantity]) => ({
      sessionId,
      quantity,
      reservedUntil:
        allReservations.find((r) => r.sessionId === sessionId)?.reservedUntil ||
        new Date().toISOString(),
    }));

    // OPTIMIZATION: Use single aggregation pipeline instead of multiple queries
    const pendingOrderDetails: Array<{ sessionId: string; quantity: number }> =
      [];
    let confirmedOrderSessionIds = new Set<string>();
    let canceledOrderSessionIds = new Set<string>();

    try {
      const mongoClient = await clientPromise;
      const db = mongoClient.db("himspired");
      const ordersCollection = db.collection("orders");

      // OPTIMIZATION: Use aggregation pipeline for better performance
      const orderStats = await ordersCollection
        .aggregate([
          {
            $match: {
              "items.productId": productId,
              status: {
                $in: ["payment_pending", "payment_confirmed", "canceled"],
              },
            },
          },
          {
            $group: {
              _id: "$status",
              sessionIds: { $addToSet: "$sessionId" },
              totalQuantity: {
                $sum: {
                  $reduce: {
                    input: {
                      $filter: {
                        input: "$items",
                        cond: { $eq: ["$$this.productId", productId] },
                      },
                    },
                    initialValue: 0,
                    in: { $add: ["$$value", "$$this.quantity"] },
                  },
                },
              },
            },
          },
        ])
        .toArray();

      // Process aggregation results
      const pendingOrders = orderStats.find((s) => s._id === "payment_pending");
      const confirmedOrders = orderStats.find(
        (s) => s._id === "payment_confirmed"
      );
      const canceledOrders = orderStats.find((s) => s._id === "canceled");

      if (pendingOrders) {
        pendingOrderDetails.push(
          ...pendingOrders.sessionIds.map((sessionId: string) => ({
            sessionId,
            quantity:
              pendingOrders.totalQuantity / pendingOrders.sessionIds.length,
          }))
        );
      }

      confirmedOrderSessionIds = new Set(confirmedOrders?.sessionIds || []);
      canceledOrderSessionIds = new Set(canceledOrders?.sessionIds || []);
    } catch (error) {
      console.error("Failed to check pending orders:", error);
      throw new Error(
        `MongoDB query failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    // CORRELATION LOGIC: Properly calculate total reserved quantity
    let totalReservedQuantity = 0;
    let correlatedReservations = 0;
    let uncorrelatedReservations = 0;
    let uncorrelatedPendingOrders = 0;

    // Create a map of session IDs from pending orders for quick lookup
    const pendingOrderSessionIds = new Set(
      pendingOrderDetails.map((detail) => detail.sessionId)
    );

    // Calculate reservations that are NOT correlated with pending orders
    uncorrelatedReservations = reservations.reduce((total, reservation) => {
      const isPendingOrder = pendingOrderSessionIds.has(reservation.sessionId);
      const isConfirmedOrder = confirmedOrderSessionIds.has(
        reservation.sessionId
      );
      const isCanceledOrder = canceledOrderSessionIds.has(
        reservation.sessionId
      );

      if (!isPendingOrder && !isConfirmedOrder && !isCanceledOrder) {
        return total + (reservation.quantity || 0);
      }
      return total;
    }, 0);

    // Calculate pending orders that are NOT correlated with reservations
    const reservationSessionIds = new Set(reservations.map((r) => r.sessionId));

    uncorrelatedPendingOrders = pendingOrderDetails.reduce((total, detail) => {
      if (!reservationSessionIds.has(detail.sessionId)) {
        return total + detail.quantity;
      }
      return total;
    }, 0);

    // Calculate correlated quantities
    correlatedReservations = reservations.reduce((total, reservation) => {
      if (pendingOrderSessionIds.has(reservation.sessionId)) {
        const pendingOrderDetail = pendingOrderDetails.find(
          (detail) => detail.sessionId === reservation.sessionId
        );

        if (pendingOrderDetail) {
          const maxQuantity = Math.max(
            reservation.quantity || 0,
            pendingOrderDetail.quantity || 0
          );
          return total + maxQuantity;
        }
      }
      return total;
    }, 0);

    // Total reserved quantity
    totalReservedQuantity =
      uncorrelatedReservations +
      uncorrelatedPendingOrders +
      correlatedReservations;

    // Calculate available stock
    const availableStock = Math.max(0, product.stock - totalReservedQuantity);
    const userReservation = reservations.find((r) => r.sessionId === sessionId);
    const reservedByCurrentUser = userReservation
      ? userReservation.quantity
      : 0;
    const reservedByOthers = totalReservedQuantity - reservedByCurrentUser;

    let response;

    // Check if product is out of stock
    if (product.stock <= 0) {
      response = {
        available: false,
        message: "Product is out of stock",
        stock: 0,
        permanentlyOutOfStock: true,
      };
    }
    // If user has a reservation
    else if (reservedByCurrentUser > 0) {
      response = {
        available: true,
        message: `You reserved ${reservedByCurrentUser} item${reservedByCurrentUser > 1 ? "s" : ""}`,
        stock: product.stock,
        availableStock: availableStock,
        reservedQuantity: totalReservedQuantity,
        reservedByCurrentUser,
        reservedByOthers,
        isReservedByCurrentUser: true,
      };
    }
    // If all items are reserved by others
    else if (availableStock === 0) {
      let message = "Item currently reserved by another customer";
      if (reservedByOthers >= product.stock) {
        message = "Item reserved by other users";
      }

      response = {
        available: false,
        message: message,
        stock: product.stock,
        availableStock: 0,
        reservedQuantity: totalReservedQuantity,
        reservedByCurrentUser,
        reservedByOthers,
        isReservedByOtherUser: true,
      };
    }
    // If some items are reserved by others, but there is still available stock
    else if (reservedByOthers > 0 && availableStock > 0) {
      response = {
        available: true,
        message: `${availableStock} in stock, ${reservedByOthers} currently reserved by others`,
        stock: product.stock,
        availableStock: availableStock,
        reservedQuantity: totalReservedQuantity,
        reservedByCurrentUser,
        reservedByOthers,
        isReservedByOtherUser: true,
      };
    }
    // Product is available
    else {
      response = {
        available: true,
        message: `${availableStock} in stock`,
        stock: product.stock,
        availableStock: availableStock,
        reservedQuantity: totalReservedQuantity,
        reservedByCurrentUser,
        reservedByOthers,
      };
    }

    // OPTIMIZATION: Cache the result for 30 seconds
    try {
      await cacheService.setProductCache(cacheKey, response, 30);
    } catch (error) {
      console.warn("Availability cache set failed:", error);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Availability check error:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}
