import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiting for checkout sessions
const checkoutAttempts = new Map<
  string,
  { count: number; firstAttempt: number }
>();
const MAX_CHECKOUT_ATTEMPTS = 10;
const WINDOW_MS = 60 * 1000; // 1 minute

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  try {
    // Simple rate limiting
    const clientIp = getClientIp(req);
    const now = Date.now();
    let entry = checkoutAttempts.get(clientIp);

    if (!entry || now - entry.firstAttempt > WINDOW_MS) {
      entry = { count: 0, firstAttempt: now };
    }

    entry.count++;
    checkoutAttempts.set(clientIp, entry);

    if (entry.count > MAX_CHECKOUT_ATTEMPTS) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: "Too many checkout attempts. Please try again later.",
        },
        { status: 429 }
      );
    }

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

    // For now, just validate the session creation without storing in database
    // The session management is now handled client-side with localStorage
    console.log(`✅ Checkout session validated for sessionId: ${sessionId}`);

    return NextResponse.json({
      success: true,
      message: "Checkout session validated successfully",
      sessionId,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
    });
  } catch (error) {
    console.error("Error validating checkout session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Simple rate limiting
    const clientIp = getClientIp(req);
    const now = Date.now();
    let entry = checkoutAttempts.get(clientIp);
    
    if (!entry || now - entry.firstAttempt > WINDOW_MS) {
      entry = { count: 0, firstAttempt: now };
    }
    
    entry.count++;
    checkoutAttempts.set(clientIp, entry);
    
    if (entry.count > MAX_CHECKOUT_ATTEMPTS) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: "Too many checkout attempts. Please try again later.",
        },
        { status: 429 }
      );
    }
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Simple session deactivation without external API calls
    console.log(`✅ Checkout session deactivated for sessionId: ${sessionId}`);

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
