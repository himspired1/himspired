import { NextRequest, NextResponse } from "next/server";
import { RateLimiter } from "@/lib/rate-limiter";
import { client, writeClient } from "@/sanity/client";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await context.params;

    // Apply rate limiting for checkout reservations
    const rateLimitResult = RateLimiter.checkRateLimitForAPI(req, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 requests per minute
    });

    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    const { sessionId, quantity = 1 } = await req.json();

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "Valid session ID is required" },
        { status: 400 }
      );
    }

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Validate session ID format
    const isValidSessionId = /^[a-z0-9_-]+$/.test(sessionId);
    if (!isValidSessionId) {
      return NextResponse.json(
        { error: "Invalid session ID format" },
        { status: 400 }
      );
    }

    // Fetch the product to check availability
    const product = await client.fetch(
      `*[_type == "clothingItem" && _id == $productId][0]`,
      { productId }
    );

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if product is in stock
    if (product.stock <= 0) {
      return NextResponse.json(
        { error: "Product is out of stock" },
        { status: 400 }
      );
    }

    // Check if requested quantity is available
    if (quantity > product.stock) {
      return NextResponse.json(
        { error: "Requested quantity exceeds available stock" },
        { status: 400 }
      );
    }

    // Create a 24-hour reservation
    const reservedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Get current reservations and filter out existing ones for this session
    const currentReservations = product.reservations || [];
    const otherReservations = currentReservations.filter(
      (r: { sessionId: string; quantity: number; reservedUntil: string }) =>
        r.sessionId !== sessionId
    );

    // Add new reservation (replacing any existing ones for this session)
    const newReservations = [
      ...otherReservations,
      {
        sessionId,
        quantity,
        reservedUntil: reservedUntil.toISOString(),
      },
    ];

    // Update the product with the new reservations
    await writeClient
      .patch(productId)
      .set({ reservations: newReservations })
      .commit();

    console.log(
      `✅ Product ${productId} reserved: ${quantity} units for session ${sessionId}`
    );

    return NextResponse.json({
      success: true,
      message: "Product reserved successfully",
      productId,
      sessionId,
      quantity,
      reservedUntil: reservedUntil.toISOString(),
    });
  } catch (error) {
    console.error("Error reserving product for checkout:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
