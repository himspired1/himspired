export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/lib/order";
import { writeClient } from "@/sanity/client";

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

    // Update order status
    await orderService.updateOrderStatus(orderId, status);

    // Handle reservation release based on status
    if (status === "payment_confirmed" || status === "canceled") {
      // Get the order to find the items that need reservation release
      const order = await orderService.getOrder(orderId);

      if (order && order.items) {
        // Release reservations for all items in the order
        const releasePromises = order.items.map(async (item) => {
          try {
            // Get current product reservations
            const product = await writeClient.fetch(
              `*[_type == "clothingItem" && _id == $productId][0]{
                _id, title, stock, reservations
              }`,
              { productId: item.productId }
            );

            if (product && product.reservations) {
              // Remove reservations for this order's session
              // We'll identify reservations by matching the quantity and recent timing
              const now = new Date();
              const updatedReservations = product.reservations.filter(
                (reservation: { reservedUntil: string }) => {
                  // Keep reservations that are still valid and not related to this order
                  const reservationDate = new Date(reservation.reservedUntil);
                  return reservationDate > now;
                }
              );

              // Update the product with cleaned reservations
              await writeClient
                .patch(item.productId)
                .set({ reservations: updatedReservations })
                .commit();
            }
          } catch (error) {
            console.error(
              `Failed to release reservation for product ${item.productId}:`,
              error
            );
          }
        });

        await Promise.all(releasePromises);
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
