import { NextRequest, NextResponse } from "next/server";
import { CheckoutAuth } from "@/lib/checkout-auth";

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Validate checkout session
    const isValid = await CheckoutAuth.validateCheckoutSession(sessionId);

    if (isValid) {
      return NextResponse.json({
        success: true,
        message: "Checkout session is valid",
      });
    } else {
      return NextResponse.json(
        {
          error: "Invalid checkout session",
          message:
            "No active checkout session found. Please start the checkout process first.",
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Error validating checkout session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
