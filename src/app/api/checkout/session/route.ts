import { NextRequest, NextResponse } from "next/server";
import { CheckoutAuth } from "@/lib/checkout-auth";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, cartItems } = await req.json();

    if (!sessionId || !cartItems || !Array.isArray(cartItems)) {
      return NextResponse.json(
        { error: "Session ID and cart items are required" },
        { status: 400 }
      );
    }

    // Validate cart items structure
    const validCartItems = cartItems.every(
      (item) =>
        item.productId &&
        typeof item.quantity === "number" &&
        typeof item.price === "number"
    );

    if (!validCartItems) {
      return NextResponse.json(
        { error: "Invalid cart items format" },
        { status: 400 }
      );
    }

    // Create checkout session
    const sessionCreated = await CheckoutAuth.createCheckoutSession(
      sessionId,
      cartItems
    );

    if (!sessionCreated) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Checkout session created successfully",
      sessionId,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Deactivate checkout session
    const sessionDeactivated =
      await CheckoutAuth.deactivateCheckoutSession(sessionId);

    if (!sessionDeactivated) {
      return NextResponse.json(
        { error: "Failed to deactivate checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Checkout session deactivated successfully",
    });
  } catch (error) {
    console.error("Error deactivating checkout session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
