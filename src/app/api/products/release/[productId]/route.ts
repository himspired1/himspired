import { NextRequest, NextResponse } from "next/server";
import { client, writeClient } from "@/sanity/client";
import { sanityRateLimiter } from "@/lib/sanity-retry";

type Reservation = {
  sessionId: string;
  quantity: number;
  reservedUntil: string;
};

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await context.params;
    const { sessionId, quantity = 1 } = await req.json();

    if (!productId || !sessionId) {
      return NextResponse.json(
        { error: "Product ID and session ID are required" },
        { status: 400 }
      );
    }

    // Fetch product and reservations
    const product = await client.fetch(
      `*[_type == "clothingItem" && _id == $productId][0]{
        _id, stock, reservations
      }`,
      { productId }
    );

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Clean up expired reservations
    const now = new Date();
    const reservations: Reservation[] = (product.reservations || []).filter(
      (r: Reservation) => r.reservedUntil && new Date(r.reservedUntil) > now
    );

    // Find current user's reservation (if any)
    const userReservation = reservations.find((r) => r.sessionId === sessionId);

    if (!userReservation) {
      return NextResponse.json({
        success: false,
        error: "No reservation found for this session",
      });
    }

    let newReservations: Reservation[];
    if (userReservation.quantity > quantity) {
      // Decrement the quantity
      newReservations = reservations.map((r) =>
        r.sessionId === sessionId
          ? { ...r, quantity: r.quantity - quantity }
          : r
      );
    } else {
      // Remove the reservation entirely
      newReservations = reservations.filter((r) => r.sessionId !== sessionId);
    }

    // Use rate limiting and retry logic for Sanity operations
    const result = await sanityRateLimiter.executeWithRateLimit(
      "release-reservation",
      async () => {
        // Patch the product with the updated reservations array
        await writeClient
          .patch(productId)
          .set({ reservations: newReservations })
          .commit();

        return {
          success: true,
          message: "Reservation released",
          productId,
          sessionId,
          reservations: newReservations,
        };
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Release reservation error:", error);

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
    }

    return NextResponse.json(
      { error: "Failed to release reservation" },
      { status: 500 }
    );
  }
}
