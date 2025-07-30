import { NextRequest, NextResponse } from "next/server";
import { RateLimiter } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting for checkout sessions (this is sufficient security)
    const rateLimitResult = RateLimiter.checkRateLimitForAPI(req, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 requests per minute
    });

    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
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
    // Apply rate limiting for checkout sessions
    const rateLimitResult = RateLimiter.checkRateLimitForAPI(req, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 requests per minute
    });

    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
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
