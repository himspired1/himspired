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

    // Use rate limiting and retry logic for Sanity operations
    const result = await sanityRateLimiter.executeWithRateLimit(
      "reserve-product",
      async () => {
        // Fetch product and reservations
        const product = await client.fetch(
          `*[_type == "clothingItem" && _id == $productId][0]{
            _id, title, stock, reservations
          }`,
          { productId }
        );

        if (!product) {
          throw new Error("Product not found");
        }

        // Clean up expired reservations
        const now = new Date();
        const reservations: Reservation[] = (product.reservations || []).filter(
          (r: Reservation) => r.reservedUntil && new Date(r.reservedUntil) > now
        );

        // Find current user's reservation (if any)
        const userReservation = reservations.find(
          (r) => r.sessionId === sessionId
        );
        const otherReservations = reservations.filter(
          (r) => r.sessionId !== sessionId
        );

        // Calculate total reserved by others
        const reservedByOthers = otherReservations.reduce(
          (sum, r) => sum + (r.quantity || 0),
          0
        );

        // Calculate available stock for this reservation
        const availableStock = product.stock - reservedByOthers;

        if (quantity > availableStock) {
          throw new Error(
            `Only ${availableStock} items available for reservation`
          );
        }

        // Set new reservedUntil (e.g., 10 minutes from now)
        const reservedUntil = new Date();
        reservedUntil.setMinutes(reservedUntil.getMinutes() + 10);

        // Update or add the user's reservation
        let newReservations: Reservation[];
        if (userReservation) {
          newReservations = reservations.map((r) =>
            r.sessionId === sessionId
              ? { ...r, quantity, reservedUntil: reservedUntil.toISOString() }
              : r
          );
        } else {
          newReservations = [
            ...reservations,
            { sessionId, quantity, reservedUntil: reservedUntil.toISOString() },
          ];
        }

        // Patch the product with the new reservations array
        await writeClient
          .patch(productId)
          .set({ reservations: newReservations })
          .commit();

        return {
          success: true,
          message: "Product reserved successfully",
          productId,
          sessionId,
          quantity,
          reservedUntil: reservedUntil.toISOString(),
          availableStock:
            product.stock -
            newReservations.reduce((sum, r) => sum + (r.quantity || 0), 0),
          reservations: newReservations,
        };
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Reservation error:", error);

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
      { error: "Failed to reserve product" },
      { status: 500 }
    );
  }
}
