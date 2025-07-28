import { NextRequest, NextResponse } from "next/server";
import { client, writeClient } from "@/sanity/client";
import { sanityRateLimiter } from "@/lib/sanity-retry";
import clientPromise from "@/lib/mongodb";

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
    const { sessionId, quantity = 1, isUpdate = false } = await req.json();

    if (!productId || !sessionId) {
      return NextResponse.json(
        { error: "Product ID and session ID are required" },
        { status: 400 }
      );
    }

    // Use rate limiting and retry logic for Sanity operations
    const result = await sanityRateLimiter.executeWithRateLimit(
      "checkout-reserve-product",
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

        // Check for pending orders that contain this product
        let pendingOrderReservedQuantity = 0;
        try {
          const mongoClient = await clientPromise;
          const db = mongoClient.db("himspired");
          const ordersCollection = db.collection("orders");

          // Find pending orders that contain this product
          const pendingOrders = await ordersCollection
            .find({
              status: "payment_pending",
              "items.productId": productId,
            })
            .toArray();

          // Calculate total quantity reserved by pending orders
          pendingOrderReservedQuantity = pendingOrders.reduce(
            (total, order) => {
              const orderItem = order.items.find(
                (item: { productId: string; quantity: number }) =>
                  item.productId === productId
              );
              return total + (orderItem ? orderItem.quantity : 0);
            },
            0
          );
        } catch (error) {
          console.error("Failed to check pending orders:", error);
        }

        // Calculate available stock for this reservation (including pending orders)
        const totalReservedByOthers =
          reservedByOthers + pendingOrderReservedQuantity;
        const availableStock = product.stock - totalReservedByOthers;

        // For updates, check if the new quantity is valid
        if (isUpdate && userReservation) {
          const currentUserQuantity = userReservation.quantity;
          const additionalQuantity = quantity - currentUserQuantity;

          if (additionalQuantity > availableStock) {
            let errorMessage = `Cannot reserve ${additionalQuantity} more items. Only ${availableStock} available.`;
            if (pendingOrderReservedQuantity > 0) {
              errorMessage += ` (${pendingOrderReservedQuantity} items are in pending orders)`;
            }
            throw new Error(errorMessage);
          }
        } else if (quantity > availableStock) {
          let errorMessage = `Only ${availableStock} items available for reservation`;
          if (pendingOrderReservedQuantity > 0) {
            errorMessage += ` (${pendingOrderReservedQuantity} items are in pending orders)`;
          }
          throw new Error(errorMessage);
        }

        // Set reservation to 24 hours for checkout
        const reservedUntil = new Date();
        reservedUntil.setHours(reservedUntil.getHours() + 24);

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

        // Generate a unique reservation ID
        const reservationId = `${sessionId}-${productId}-${Date.now()}`;

        return {
          success: true,
          message: "Product reserved for checkout successfully",
          productId,
          sessionId,
          quantity,
          reservationId,
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
    console.error("Checkout reservation error:", error);

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
      { error: "Failed to reserve product for checkout" },
      { status: 500 }
    );
  }
}
