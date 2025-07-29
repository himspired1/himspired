import { NextRequest, NextResponse } from "next/server";
import { client, writeClient } from "@/sanity/client";
import { sanityRateLimiter } from "@/lib/sanity-retry";

type Reservation = {
  sessionId: string;
  quantity: number;
  reservedUntil: string;
};

type ReleaseItem = {
  productId: string;
  quantity: number;
};

export async function POST(req: NextRequest) {
  try {
    const { sessionId, items }: { sessionId: string; items: ReleaseItem[] } =
      await req.json();

    if (!sessionId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Session ID and items array are required" },
        { status: 400 }
      );
    }

    // Validate all items first
    const productIds = items.map((item) => item.productId);
    const products = await client.fetch(
      `*[_type == "clothingItem" && _id in $productIds]{
        _id, stock, reservations
      }`,
      { productIds }
    );

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "One or more products not found" },
        { status: 404 }
      );
    }

    // Create a map for easy lookup
    const productMap = new Map(products.map((p) => [p._id, p]));

    // Validate all releases can be performed
    const validationErrors: string[] = [];
    const releaseOperations: Array<{
      productId: string;
      product: any;
      quantity: number;
      newReservations: Reservation[];
    }> = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        validationErrors.push(`Product ${item.productId} not found`);
        continue;
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

      if (!userReservation) {
        validationErrors.push(
          `No reservation found for product ${item.productId}`
        );
        continue;
      }

      if (userReservation.quantity < item.quantity) {
        validationErrors.push(
          `Insufficient reserved quantity for product ${item.productId}`
        );
        continue;
      }

      // Calculate new reservations
      let newReservations: Reservation[];
      if (userReservation.quantity > item.quantity) {
        // Decrement the quantity
        newReservations = reservations.map((r) =>
          r.sessionId === sessionId
            ? { ...r, quantity: r.quantity - item.quantity }
            : r
        );
      } else {
        // Remove the reservation entirely
        newReservations = reservations.filter((r) => r.sessionId !== sessionId);
      }

      releaseOperations.push({
        productId: item.productId,
        product,
        quantity: item.quantity,
        newReservations,
      });
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    // Use rate limiting and retry logic for Sanity operations
    const result = await sanityRateLimiter.executeWithRateLimit(
      "batch-release-reservations",
      async () => {
        // Perform all releases atomically
        const patchOperations = releaseOperations.map((operation) =>
          writeClient
            .patch(operation.productId)
            .set({ reservations: operation.newReservations })
        );

        // Execute all patches
        await Promise.all(patchOperations.map((patch) => patch.commit()));

        return {
          success: true,
          message: "All reservations released successfully",
          sessionId,
          releasedItems: releaseOperations.map((op) => ({
            productId: op.productId,
            quantity: op.quantity,
          })),
        };
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Batch release error:", error);

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
    }

    return NextResponse.json(
      { error: "Failed to release reservations" },
      { status: 500 }
    );
  }
}
