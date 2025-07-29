export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/lib/order";
import { client, writeClient } from "@/sanity/client";
import { isValidOrderStatus } from "@/models/order";
import { CheckoutAuth } from "@/lib/checkout-auth";

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
              // For payment confirmation, clear ONLY the reservation for the paying user (order.sessionId)
              const sessionIdToRemove = order.sessionId;
              console.log(
                "DEBUG: All reservation sessionIds before:",
                product.reservations.map(
                  (r: { sessionId?: string }) => r.sessionId
                )
              );
              console.log(
                "DEBUG: Order sessionId to remove:",
                sessionIdToRemove
              );
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
              console.log(
                "DEBUG: All reservation sessionIds after:",
                updatedReservations.map(
                  (r: { sessionId?: string }) => r.sessionId
                )
              );
              console.log(
                `Clearing reservation for sessionId ${sessionIdToRemove} for product ${item.productId} after payment confirmation`
              );

              await writeClient
                .patch(item.productId)
                .set({
                  reservations: updatedReservations,
                  _updatedAt: new Date().toISOString(),
                })
                .commit();

              console.log(
                `✅ Cleared reservation for sessionId ${sessionIdToRemove} for product ${item.productId}`
              );
            }

            // If payment is confirmed, also decrement stock to reflect the sale
            if (status === "payment_confirmed") {
              console.log(
                `🔄 Starting stock decrement for product ${item.productId}`
              );
              // Extract base product ID from order product ID (remove size and timestamp metadata)
              const baseProductId = item.productId.split(":::")[0];
              try {
                console.log(`📦 Base product ID: ${baseProductId}`);

                // Get current stock first
                console.log(
                  `🔍 Getting current stock for product ${baseProductId}`
                );
                const stockCheckResponse = await fetch(
                  `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/products/stock/${baseProductId}?sessionId=order-${orderId}`,
                  {
                    method: "GET",
                    headers: {
                      "Content-Type": "application/json",
                    },
                  }
                );

                console.log(
                  `📊 Stock check response status: ${stockCheckResponse.status}`
                );
                if (stockCheckResponse.ok) {
                  const stockData = await stockCheckResponse.json();
                  const currentStock = stockData.stock || 0;
                  const newStock = Math.max(0, currentStock - item.quantity);
                  console.log(
                    `📈 Stock calculation: ${currentStock} - ${item.quantity} = ${newStock}`
                  );

                  // Update stock using the simple update API
                  const stockToken =
                    process.env.STOCK_MODIFICATION_TOKEN || "admin-stock-token";
                  console.log("🪪 Using stock token:", stockToken);
                  console.log(
                    `💾 Updating stock to ${newStock} for product ${baseProductId}`
                  );
                  const stockResponse = await fetch(
                    `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/products/update-stock/${baseProductId}`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${stockToken}`,
                      },
                      body: JSON.stringify({
                        newStock: newStock,
                      }),
                    }
                  );

                  console.log(
                    `📊 Stock update response status: ${stockResponse.status}`
                  );
                  let stockResult;
                  try {
                    stockResult = await stockResponse.json();
                  } catch {
                    stockResult = {
                      error: "Failed to parse stock update response",
                      raw: await stockResponse.text(),
                    };
                  }
                  console.log("🪵 Stock update response:", stockResult);
                  if (stockResponse.ok) {
                    console.log(
                      `✅ Stock updated for product ${baseProductId}: ${currentStock} -> ${newStock}`
                    );

                    // Broadcast stock update to all connected clients
                    // This will trigger real-time updates in the UI
                    console.log(
                      `📢 Broadcasting stock update for product ${baseProductId}`
                    );

                    // Trigger stock update notification
                    try {
                      await fetch(
                        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/products/trigger-stock-update/${baseProductId}`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization:
                              process.env.STOCK_MODIFICATION_TOKEN ||
                              "admin-stock-token",
                          },
                        }
                      );
                    } catch (triggerError) {
                      console.error(
                        `Error triggering stock update for product ${baseProductId}:`,
                        triggerError
                      );
                    }
                  } else {
                    const errorText = await stockResponse.text();
                    console.error(
                      `❌ Failed to update stock for product ${baseProductId}: ${errorText}`
                    );
                  }
                } else {
                  console.error(
                    `Failed to get current stock for product ${baseProductId}`
                  );
                }
              } catch (stockError) {
                console.error(
                  `Error updating stock for product ${baseProductId}:`,
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
                      // Extract base product ID from order product ID (remove size and timestamp metadata)
                      const baseProductId = item.productId.split(":::")[0];

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
