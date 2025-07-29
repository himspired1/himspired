import { NextRequest, NextResponse } from "next/server";
import { client, writeClient } from "@/sanity/client";
import { StockAuth } from "@/lib/stock-auth";
import { RateLimiter } from "@/lib/rate-limiter";

/**
 * Force Cleanup Reservations Endpoint
 *
 * This endpoint forcefully cleans up all reservations for a specific product.
 * It's used when reservations are stuck and need manual intervention.
 *
 * Usage: POST /api/products/force-cleanup/[productId]
 * Body: { sessionId?: string, clearAll?: boolean }
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  const { productId } = await context.params;

  try {
    // Apply rate limiting for sensitive cleanup operations
    const rateLimitMiddleware = RateLimiter.middleware({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5, // 5 requests per minute (more restrictive for cleanup)
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
          message: "Valid token required to force cleanup reservations",
        },
        { status: 401 }
      );
    }

    // Validate productId format
    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Validate productId format (should be a non-empty string)
    if (typeof productId !== "string" || productId.trim().length === 0) {
      return NextResponse.json(
        { error: "Invalid product ID format" },
        { status: 400 }
      );
    }

    // Parse request body with error handling
    let requestBody: { sessionId?: string; clearAll?: boolean };
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      return NextResponse.json(
        {
          error: "Invalid JSON in request body",
          message: "Request body must be valid JSON",
        },
        { status: 400 }
      );
    }

    const { sessionId, clearAll = false } = requestBody;

    // Validate sessionId if provided
    if (sessionId !== undefined && sessionId !== null) {
      if (typeof sessionId !== "string" || sessionId.trim().length === 0) {
        return NextResponse.json(
          {
            error: "Invalid session ID",
            message: "Session ID must be a non-empty string",
          },
          { status: 400 }
        );
      }
    }

    // Get current product data
    const product = await client.fetch(
      `*[_type == "clothingItem" && _id == $productId][0]{
        _id, _rev, title, stock, reservations
      }`,
      { productId }
    );

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let updatedReservations = product.reservations || [];
    const originalCount = updatedReservations.length;

    // Type guard for reservation objects
    const isValidReservation = (
      reservation: unknown
    ): reservation is { sessionId?: string; reservedUntil?: string } => {
      return typeof reservation === "object" && reservation !== null;
    };

    if (clearAll) {
      // Clear all reservations
      updatedReservations = [];
      console.log(
        `🧹 Force clearing ALL reservations for product ${productId}`
      );
    } else if (sessionId) {
      // Clear reservations for specific session
      updatedReservations = updatedReservations.filter(
        (reservation: unknown) => {
          if (!isValidReservation(reservation)) {
            console.warn("Invalid reservation object found, skipping");
            return true; // Keep invalid reservations to avoid data loss
          }
          return reservation.sessionId !== sessionId;
        }
      );
      console.log(
        `🧹 Force clearing reservations for specific session on product ${productId}`
      );
    } else {
      // Clear expired reservations
      const now = new Date();
      updatedReservations = updatedReservations.filter(
        (reservation: unknown) => {
          if (!isValidReservation(reservation)) {
            console.warn("Invalid reservation object found, skipping");
            return true; // Keep invalid reservations to avoid data loss
          }

          // Safe date parsing with validation
          const reservedUntil = reservation.reservedUntil;
          if (
            !reservedUntil ||
            typeof reservedUntil !== "string" ||
            reservedUntil.trim().length === 0
          ) {
            console.warn(
              "Invalid reservedUntil value found, keeping reservation"
            );
            return true; // Keep reservations with invalid dates
          }

          try {
            const reservationDate = new Date(reservedUntil);
            // Check if the date is valid
            if (isNaN(reservationDate.getTime())) {
              console.warn(
                "Invalid date format in reservedUntil, keeping reservation"
              );
              return true; // Keep reservations with invalid date formats
            }
            return reservationDate > now;
          } catch (dateError) {
            console.warn(
              "Error parsing reservation date, keeping reservation:",
              dateError
            );
            return true; // Keep reservations that cause parsing errors
          }
        }
      );
      console.log(
        `🧹 Force clearing expired reservations for product ${productId}`
      );
    }

    const clearedCount = originalCount - updatedReservations.length;

    // Update the product with cleaned reservations using optimistic locking
    await writeClient
      .patch(productId)
      .ifRevisionId(product._rev)
      .set({
        reservations: updatedReservations,
      })
      .commit();

    console.log(
      `✅ Force cleanup completed for product ${productId}: ${clearedCount} reservations cleared`
    );

    return NextResponse.json({
      success: true,
      message: `Force cleanup completed`,
      productId,
      originalCount,
      clearedCount,
      remainingCount: updatedReservations.length,
      productTitle: product.title,
    });
  } catch (error) {
    console.error(`Force cleanup error for product ${productId}:`, error);
    return NextResponse.json(
      { error: "Failed to force cleanup reservations" },
      { status: 500 }
    );
  }
}
