import { NextRequest, NextResponse } from "next/server";
import { ReservationHandler } from "@/lib/reservation-handler";
import { CheckoutAuth } from "@/lib/checkout-auth";

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

    // Authorization check: Verify user has an active checkout session
    const isAuthorized = await CheckoutAuth.validateCheckoutSession(sessionId);
    if (!isAuthorized) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message:
            "You must have an active checkout session to create 24-hour reservations. Please start the checkout process first.",
        },
        { status: 401 }
      );
    }

    // Use shared reservation handler with 24-hour checkout reservation
    const result = await ReservationHandler.handleReservation({
      productId,
      sessionId,
      quantity,
      isUpdate,
      reservationHours: 24, // 24 hours for checkout reservations
      operationName: "checkout-reserve-product",
      successMessage: "Product reserved for checkout successfully",
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Checkout reservation error:", error);

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
      { error: "Failed to reserve product for checkout" },
      { status: 500 }
    );
  }
}
