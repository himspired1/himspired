import { NextRequest, NextResponse } from "next/server";
import { ReservationHandler } from "@/lib/reservation-handler";
import { SessionValidator } from "@/lib/session-validator";
import { cacheService } from "@/lib/cache-service";

/**
 * Cart Reservation Endpoint
 *
 * This endpoint handles 30-minute cart reservations only.
 * For 24-hour checkout reservations, use /api/products/checkout-reserve/[productId]
 *
 * Features:
 * - Session validation and authentication
 * - Rate limiting (10 requests per 5 minutes per session)
 * - 30-minute reservation duration
 * - Audit logging
 */

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await context.params;
    const { sessionId, quantity = 1, isUpdate = false } = await req.json();

    if (!productId || !sessionId) {
      return NextResponse.json(
        { error: "Product ID and session ID are required" },
        { status: 400 }
      );
    }

    // Session validation and authentication
    const sessionInfo = await SessionValidator.validateSession(sessionId, req);
    const rateLimitInfo = SessionValidator.checkRateLimit(
      sessionId,
      sessionInfo.ipAddress
    );

    // Log the validation attempt
    SessionValidator.logSessionValidation(
      sessionInfo,
      rateLimitInfo,
      "reserve-product-cart"
    );

    // Check if session is valid
    if (!sessionInfo.isValid) {
      return NextResponse.json(
        {
          error: "Invalid session",
          message:
            "Session is invalid or expired. Please refresh your session and try again.",
        },
        { status: 401 }
      );
    }

    // Check rate limiting
    if (!rateLimitInfo.isAllowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: `Too many reservation requests. Please wait until ${rateLimitInfo.resetTime.toISOString()} before trying again.`,
          resetTime: rateLimitInfo.resetTime.toISOString(),
        },
        { status: 429 }
      );
    }

    // This endpoint handles only 30-minute cart reservations
    // For 24-hour checkout reservations, use /api/products/checkout-reserve/[productId]
    const reservationHours = 0.5; // 30 minutes for cart reservations

    // Use shared reservation handler
    const result = await ReservationHandler.handleReservation({
      productId,
      sessionId,
      quantity,
      isUpdate,
      reservationHours,
      operationName: "reserve-product",
      successMessage: "Product reserved for cart successfully",
    });

    // Clear related caches after reservation
    if (result.success) {
      try {
        await cacheService.invalidateProductRelatedCaches(productId);
      } catch (error) {
        console.warn(
          "Failed to clear product caches after reservation:",
          error
        );
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Reservation error:", error);

    // Clean up expired rate limits periodically
    SessionValidator.cleanupExpiredRateLimits();

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("Rate limit exceeded")) {
        return NextResponse.json(
          {
            error:
              "Service temporarily unavailable. Please try again in a moment.",
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
      if (error.message.includes("items available for reservation")) {
        return NextResponse.json({
          success: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json(
      { error: "Failed to reserve product for cart" },
      { status: 500 }
    );
  }
}
