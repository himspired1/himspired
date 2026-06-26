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
    const { sessionId } = await req.json();

    if (!productId || !sessionId) {
      return NextResponse.json(
        { error: "Product ID and session ID are required" },
        { status: 400 }
      );
    }

    // Use rate limiting and retry logic for Sanity operations
    const result = await sanityRateLimiter.executeWithRateLimit(
      "clear-reservation",
      async () => {
        // Get current product info from Sanity
        const product = await client.fetch(
          `*[_type == "clothingItem" && _id == $productId][0]{
            _id,
            title,
            reservations
          }`,
          { productId }
        );

        if (!product) {
          throw new Error("Product not found");
        }

        // Remove reservations based on sessionId
        let newReservations: Reservation[];
        if (sessionId === "all") {
          // Clear all reservations (used when payment is confirmed)
          newReservations = [];
          console.log(
            `Clearing all reservations for product: ${product.title}`
          );
        } else {
          // Remove only the reservation for the given sessionId
          newReservations = (product.reservations || []).filter(
            (r: Reservation) => r.sessionId !== sessionId
          );
          console.log(`Clearing reservation for session: ${sessionId}`);
        }

        await writeClient
          .patch(productId)
          .set({ reservations: newReservations })
          .commit();

        console.log(
          `✅ Reservation cleared for ${sessionId === "all" ? "all sessions" : `session: ${sessionId}`} on product: ${product.title} (${productId})`
        );

        return {
          success: true,
          message: "Reservation cleared successfully",
          productId: product._id,
          title: product.title,
        };
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Clear reservation error:", error);

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
      { error: "Failed to clear reservation" },
      { status: 500 }
    );
  }
}
