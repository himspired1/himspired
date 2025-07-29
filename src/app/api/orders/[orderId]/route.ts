export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/lib/order";
import { client, writeClient } from "@/sanity/client";
import { isValidOrderStatus } from "@/models/order";
import { CheckoutAuth } from "@/lib/checkout-auth";
import { decrementStockForOrder } from "@/lib/stock-update-utils";

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
                _id, _rev, title, stock, reservations
              }`,
              { productId: item.productId }
            );

            if (
              product &&
              product.reservations &&
              product.reservations.length > 0
            ) {
              // For payment confirmation, clear ONLY the reservation for the paying user (order.sessionId)
              const sessionIdToRemove = order.sessionId;
              // console.log(
              //   "DEBUG: All reservation sessionIds before:",
              //   product.reservations.map(
              //     (r: { sessionId?: string }) => r.sessionId
              //   )
              // );
              // console.log(
              //   "DEBUG: Order sessionId to remove:",
              //   sessionIdToRemove
              // );
              if (!sessionIdToRemove) {
                console.warn(
                  "No sessionId found on order, skipping targeted reservation removal."
                );
              }
              const updatedReservations = sessionIdToRemove
                ? product.reservations.filter(
                    (r: { sessionId?: string }) =>
                      r.sessionId !== sessionIdToRemove
                  )
                : product.reservations;
              // console.log(
              //   "DEBUG: All reservation sessionIds after:",
              //   updatedReservations.map(
              //     (r: { sessionId?: string }) => r.sessionId
              //   )
              // );
              // console.log(
              //   `Clearing reservation for sessionId ${sessionIdToRemove} for product ${item.productId} after payment confirmation`
              // );

              await writeClient
                .patch(item.productId)
                .ifRevisionId(product._rev)
                .set({
                  reservations: updatedReservations,
                })
                .commit();

              console.log(
                `✅ Cleared reservation for product ${item.productId}`
              );
            }

            // If payment is confirmed, also decrement stock to reflect the sale
            if (status === "payment_confirmed") {
              console.log(
                `🔄 Starting stock decrement for product ${item.productId}`
              );

              const stockResult = await decrementStockForOrder({
                productId: item.productId,
                quantity: item.quantity,
                orderId: orderId,
              });

              if (stockResult.success) {
                console.log(`✅ Stock updated for product ${item.productId}`);
              } else {
                console.error(
                  `❌ Failed to update stock for product ${item.productId}: ${stockResult.error}`
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

        // If payment is confirmed, also clean up any active checkout sessions
        if (status === "payment_confirmed") {
          try {
            // Get the order to find the session ID if available
            const order = await orderService.getOrder(orderId);
            if (order && order.sessionId) {
              // Clean up the checkout session
              await CheckoutAuth.deactivateCheckoutSession(order.sessionId);
              console.log(
                `✅ Checkout session cleaned up for order ${orderId}`
              );
            }

            // Additional cleanup: Release any remaining reservations for this order
            // This ensures no reservations are left behind
            const cleanupPromises =
              order && order.items
                ? order.items.map(async (item) => {
                    try {
                      const response = await fetch(
                        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/products/release/${item.productId}`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            sessionId: order.sessionId || `order_${orderId}`,
                            quantity: item.quantity,
                          }),
                        }
                      );

                      if (response.ok) {
                        console.log(
                          `✅ Released remaining reservation for product ${item.productId}`
                        );
                      }
                    } catch (cleanupError) {
                      console.error(
                        `Error releasing reservation for product ${item.productId}:`,
                        cleanupError
                      );
                    }
                  })
                : [];

            await Promise.all(cleanupPromises || []);
            console.log(
              `✅ Completed comprehensive cleanup for order ${orderId}`
            );

            // Comprehensive cleanup: Clear all reservations for order products when payment is confirmed
            // This ensures no reservations are left behind, regardless of session ID
            const comprehensiveCleanupPromises =
              order && order.items
                ? order.items.map(async (item) => {
                    try {
                      // Use the productId directly - it's already the correct Sanity product ID
                      const baseProductId = item.productId;

                      const response = await fetch(
                        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/products/force-cleanup/${baseProductId}`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${process.env.STOCK_MODIFICATION_TOKEN || "admin-stock-token"}`,
                          },
                          body: JSON.stringify({
                            clearAll: true, // Clear all reservations for this product
                          }),
                        }
                      );

                      if (response.ok) {
                        console.log(
                          `✅ Comprehensive cleanup completed for product ${baseProductId}`
                        );
                      } else {
                        console.error(
                          `❌ Comprehensive cleanup failed for product ${baseProductId}`
                        );
                      }
                    } catch (comprehensiveCleanupError) {
                      console.error(
                        `Error comprehensive cleaning up product ${item.productId}:`,
                        comprehensiveCleanupError
                      );
                    }
                  })
                : [];

            await Promise.all(comprehensiveCleanupPromises || []);
            console.log(
              `✅ Completed comprehensive cleanup for order ${orderId}`
            );
          } catch (sessionError) {
            console.error(
              `Error cleaning up checkout session for order ${orderId}:`,
              sessionError
            );
            // Don't fail the entire operation if session cleanup fails
          }
        }
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
