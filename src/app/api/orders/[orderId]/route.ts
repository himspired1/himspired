export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/lib/order";
import { OrderStatus } from "@/models/order";
import {
  sendPaymentConfirmationEmail,
  sendOrderShippedEmail,
  sendOrderCompletionEmail,
} from "@/lib/email";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params;
    const { status } = await req.json();

    const validStatuses: OrderStatus[] = [
      "payment_pending",
      "payment_confirmed",
      "shipped",
      "complete",
      "payment_not_confirmed",
      "canceled",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const currentOrder = await orderService.getOrder(orderId);
    if (!currentOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await orderService.updateOrderStatus(orderId, status);
    try {
      const { customerInfo, items, total } = currentOrder;

      switch (status) {
        case "payment_confirmed":
          // Decrement stock and clear reservations for all items in the order
          try {
            const stockAndReservationPromises = items.map(async (item) => {
              // Extract the base product ID (remove size suffix if present)
              let baseProductId = item.productId;
              // If the productId contains size suffix (like -S-1752900786241), remove it
              if (
                baseProductId.includes("-S-") ||
                baseProductId.includes("-M-") ||
                baseProductId.includes("-L-") ||
                baseProductId.includes("-XL-")
              ) {
                baseProductId = baseProductId
                  .split("-S-")[0]
                  .split("-M-")[0]
                  .split("-L-")[0]
                  .split("-XL-")[0];
              }

              console.log(
                `Processing payment confirmation for product: ${baseProductId} (original: ${item.productId}), quantity: ${item.quantity}`
              );

              // Decrement stock
              const stockResponse = await fetch(
                `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/products/decrement-stock/${baseProductId}`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    quantity: item.quantity,
                  }),
                }
              );

              if (!stockResponse.ok) {
                console.error(
                  `Failed to decrement stock for product ${baseProductId}`
                );
              } else {
                console.log(
                  `Successfully decremented stock for product ${baseProductId}`
                );
              }

              // Clear all reservations for this product since payment is confirmed
              console.log(
                `Attempting to clear all reservations for product: ${baseProductId}`
              );
              const clearReservationResponse = await fetch(
                `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/products/clear-reservation/${baseProductId}`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ sessionId: "all" }), // Clear all reservations for this product
                }
              );

              const clearResponseText = await clearReservationResponse.text();
              console.log(
                `Clear reservation response for ${item.productId}:`,
                clearResponseText
              );

              if (!clearReservationResponse.ok) {
                console.error(
                  `Failed to clear reservation for product ${baseProductId}: ${clearResponseText}`
                );
              } else {
                console.log(
                  `Successfully cleared reservation for product ${baseProductId}`
                );
              }
            });

            await Promise.all(stockAndReservationPromises);
            console.log(
              "All product stock decrements and reservation clears completed for payment confirmation"
            );
          } catch (error) {
            console.error(
              "Failed to process stock decrement or reservation clear during payment confirmation:",
              error
            );
            // Don't fail the order update if stock/reservation operations fail
          }

          await sendPaymentConfirmationEmail(
            customerInfo.email,
            customerInfo.name,
            orderId,
            items,
            total
          );
          break;
        case "shipped":
          await sendOrderShippedEmail(
            customerInfo.email,
            customerInfo.name,
            orderId
          );
          break;
        case "complete":
          await sendOrderCompletionEmail(
            customerInfo.email,
            customerInfo.name,
            orderId,
            items,
            total
          );
          break;
        case "canceled":
          // Release reservations for all items in the order without decrementing stock
          try {
            const releasePromises = items.map(async (item) => {
              // Extract the base product ID (remove size suffix if present)
              let baseProductId = item.productId;
              // If the productId contains size suffix (like -S-1752900786241), remove it
              if (
                baseProductId.includes("-S-") ||
                baseProductId.includes("-M-") ||
                baseProductId.includes("-L-") ||
                baseProductId.includes("-XL-")
              ) {
                baseProductId = baseProductId
                  .split("-S-")[0]
                  .split("-M-")[0]
                  .split("-L-")[0]
                  .split("-XL-")[0];
              }

              console.log(
                `Processing order cancellation for product: ${baseProductId} (original: ${item.productId})`
              );

              // Clear reservation by setting reservedUntil to null
              console.log(
                `Attempting to clear reservation for canceled order product: ${baseProductId}`
              );
              const clearReservationResponse = await fetch(
                `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/products/clear-reservation/${baseProductId}`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
              );

              const clearResponseText = await clearReservationResponse.text();
              console.log(
                `Clear reservation response for canceled order ${item.productId}:`,
                clearResponseText
              );

              if (!clearReservationResponse.ok) {
                console.error(
                  `Failed to clear reservation for canceled order product ${baseProductId}: ${clearResponseText}`
                );
              } else {
                console.log(
                  `Successfully cleared reservation for canceled order product ${baseProductId}`
                );
              }
            });

            await Promise.all(releasePromises);
            console.log(
              "All product reservations cleared for order cancellation"
            );
          } catch (error) {
            console.error(
              "Failed to process reservation clear during order cancellation:",
              error
            );
            // Don't fail the order update if reservation operations fail
          }
          break;
      }
    } catch (emailError) {
      console.error("Email failed:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Order status updated",
      emailSent: ["payment_confirmed", "shipped", "complete"].includes(status),
    });
  } catch (error) {
    console.error("Status update failed:", error);
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
