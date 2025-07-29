export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/lib/order";
import { client, writeClient } from "@/sanity/client";
import { isValidOrderStatus } from "@/models/order";

/**
 * Order Status Update Endpoint
 *
 * When payment is confirmed:
 * 1. Release reservations for the order items
 * 2. Decrement stock to reflect the sale
 * 3. Make updated stock available to other users
 *
 * When order is canceled:
 * 1. Release reservations for the order items
 * 2. Stock remains unchanged (items return to available inventory)
 */

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params;
    const { status } = await req.json();

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Validate that the status is a valid order status
    if (!isValidOrderStatus(status)) {
      return NextResponse.json(
        {
          error: "Invalid status value",
          message:
            "Status must be one of: payment_pending, payment_confirmed, shipped, complete, payment_not_confirmed, canceled",
        },
        { status: 400 }
      );
    }

    // Update order status
    await orderService.updateOrderStatus(orderId, status);

    // Handle reservation release and stock updates based on status
    if (status === "payment_confirmed" || status === "canceled") {
      // Get the order to find the items that need reservation release
      const order = await orderService.getOrder(orderId);

      if (order && order.items) {
        // Process each item: release reservations and update stock if payment confirmed
        const processPromises = order.items.map(async (item) => {
          try {
            // Use read-only client for fetching product data
            const product = await client.fetch(
              `*[_type == "clothingItem" && _id == $productId][0]{
                _id, title, stock, reservations
              }`,
              { productId: item.productId }
            );

            if (
              product &&
              product.reservations &&
              product.reservations.length > 0
            ) {
              // Create a unique identifier for this order's reservations
              // We'll use the orderId and item quantity to identify related reservations
              const orderReservationIdentifier = `${orderId}_${item.productId}_${item.quantity}`;

              // Filter out reservations that belong to this order
              // We'll identify them by matching quantity and recent timing (within last 2 hours)
              const now = new Date();
              const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

              const updatedReservations = product.reservations.filter(
                (reservation: {
                  sessionId?: string;
                  quantity: number;
                  reservedUntil: string;
                  orderId?: string;
                }) => {
                  const reservationDate = new Date(reservation.reservedUntil);

                  // Keep reservations that are:
                  // 1. Still valid (not expired)
                  // 2. Not matching this order's quantity and timing
                  // 3. Not explicitly marked as belonging to this order
                  const isRecent = reservationDate > twoHoursAgo;
                  const matchesOrderQuantity =
                    reservation.quantity === item.quantity;
                  const belongsToThisOrder = reservation.orderId === orderId;

                  // Remove if it belongs to this order or matches suspicious criteria
                  if (
                    belongsToThisOrder ||
                    (isRecent && matchesOrderQuantity)
                  ) {
                    console.log(
                      `Removing reservation for order ${orderId}, product ${item.productId}`
                    );
                    return false;
                  }

                  return reservationDate > now; // Keep only valid reservations
                }
              );

              // Use atomic update to prevent race conditions
              await writeClient
                .patch(item.productId)
                .set({
                  reservations: updatedReservations,
                  _updatedAt: new Date().toISOString(),
                })
                .commit();

              console.log(
                `Updated reservations for product ${item.productId}: ${product.reservations.length} -> ${updatedReservations.length}`
              );
            }

            // If payment is confirmed, also decrement stock to reflect the sale
            if (status === "payment_confirmed") {
              try {
                // Decrement stock using the stock decrement API
                const stockResponse = await fetch(
                  `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/products/decrement-stock/${item.productId}`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization:
                        process.env.STOCK_MODIFICATION_TOKEN ||
                        "admin-stock-token",
                    },
                    body: JSON.stringify({
                      quantity: item.quantity,
                    }),
                  }
                );

                if (stockResponse.ok) {
                  const stockResult = await stockResponse.json();
                  console.log(
                    `✅ Stock decremented for product ${item.productId}: ${stockResult.previousStock} -> ${stockResult.newStock}`
                  );
                } else {
                  console.error(
                    `Failed to decrement stock for product ${item.productId}:`,
                    await stockResponse.text()
                  );
                }
              } catch (stockError) {
                console.error(
                  `Error decrementing stock for product ${item.productId}:`,
                  stockError
                );
              }
            }
          } catch (error) {
            console.error(
              `Failed to process product ${item.productId} for order ${orderId}:`,
              error
            );
            // Don't throw here to allow other items to be processed
          }
        });

        await Promise.all(processPromises);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update order status:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params;
    const order = await orderService.getOrder(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Failed to fetch order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}
