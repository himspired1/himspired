import { NextRequest, NextResponse } from "next/server";
import { rateLimiter } from "@/lib/rate-limiter";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Check rate limit for checkout operations
 * @param clientIp - The client IP address
 * @returns NextResponse if rate limit exceeded, null otherwise
 */
async function checkRateLimit(clientIp: string): Promise<NextResponse | null> {
  const rateLimitResult = await rateLimiter.checkRateLimit(clientIp, {
    maxAttempts: 10,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: "rate_limit:checkout_sessions",
  });

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: "Too many checkout attempts. Please try again later.",
        resetTime: rateLimitResult.resetTime,
        remaining: rateLimitResult.remaining,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
        },
      }
    );
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const clientIp = getClientIp(req);
    const rateLimitResponse = await checkRateLimit(clientIp);
    if (rateLimitResponse) {
      return rateLimitResponse;
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
    // Rate limiting
    const clientIp = getClientIp(req);
    const rateLimitResponse = await checkRateLimit(clientIp);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // For now, just validate the session deletion without storing in database
    console.log(`✅ Checkout session cleared for sessionId: ${sessionId}`);

    return NextResponse.json({
      success: true,
      message: "Checkout session cleared successfully",
      sessionId,
    });
  } catch (error) {
    console.error("Error clearing checkout session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
