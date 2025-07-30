import { NextRequest, NextResponse } from "next/server";
import { AdminAuth } from "@/lib/admin-auth";
import { RateLimiter } from "@/lib/rate-limiter";
import { decrementStockForOrder } from "@/lib/stock-update-utils";
import { cleanupOrderReservations } from "@/lib/order-cleanup";
import { orderService } from "@/lib/order";

interface OrderItem {
  productId: string;
  quantity: number;
  title: string;
  price: number;
  size?: string;
  category: string;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params;

  try {
    // Apply rate limiting for order retrieval
    const rateLimitResult = RateLimiter.checkRateLimitForAPI(req, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20, // 20 requests per minute
    });

    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    // Get order details using the order service (MongoDB)
    let order = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (!order && attempts < maxAttempts) {
      attempts++;

      try {
        order = await orderService.getOrder(orderId);
      } catch (error) {
        console.error(`Error on attempt ${attempts}:`, error);
      }

      if (!order && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error) {
    console.error(`Error retrieving order ${orderId}:`, error);
    return NextResponse.json(
      {
        error: "Failed to retrieve order",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params;

  try {
    // Apply rate limiting for order updates
    const rateLimitResult = RateLimiter.checkRateLimitForAPI(req, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 requests per minute
    });

    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    // Use admin authentication for order updates
    const isAuthorized = await AdminAuth.isAuthenticatedFromRequest(req);
    if (!isAuthorized) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Admin authentication required to update order status",
        },
        { status: 401 }
      );
    }

    const { status } = await req.json();

    if (!status) {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "Status is required",
        },
        { status: 400 }
      );
    }

    // Get current order
    const order = await orderService.getOrder(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const previousStatus = order.status;

    // Update order status using the order service
    await orderService.updateOrderStatus(orderId, status);

    // Handle payment confirmation
    if (
      status === "payment_confirmed" &&
      previousStatus !== "payment_confirmed"
    ) {
      // Step 1: Decrement stock for each item in the order
      if (order.items && order.items.length > 0) {
        const stockUpdatePromises = order.items.map(async (item: OrderItem) => {
          try {
            const result = await decrementStockForOrder({
              productId: item.productId,
              quantity: item.quantity,
              orderId: orderId,
            });

            if (!result.success) {
              console.error(
                `❌ Failed to decrement stock for product ${item.productId}: ${result.error}`
              );
            }

            return result;
          } catch (error) {
            console.error(
              `❌ Error decrementing stock for product ${item.productId}:`,
              error
            );
            return {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        });

        await Promise.all(stockUpdatePromises);
      }

      // Step 2: Wait a moment to ensure stock updates are processed
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 3: Consolidated cleanup - replaces multiple API calls
      if (order.items && order.items.length > 0) {
        const cleanupResult = await cleanupOrderReservations({
          orderId,
          sessionId: order.sessionId,
        });

        if (!cleanupResult.success) {
          console.warn(
            `⚠️ Order cleanup completed with errors:`,
            cleanupResult.message
          );
          if (cleanupResult.errors && cleanupResult.errors.length > 0) {
            cleanupResult.errors.forEach((error) =>
              console.warn(`   - Error: ${error}`)
            );
          }
        }
      }

      // Step 4: Final cache invalidation to ensure fresh data
      if (order.items && order.items.length > 0) {
        const cacheClearPromises = order.items.map(async (item: OrderItem) => {
          try {
            const baseUrl =
              process.env.BASE_URL ||
              process.env.NEXT_PUBLIC_BASE_URL ||
              "http://localhost:3000";
            const cacheClearResponse = await fetch(
              `${baseUrl}/api/products/stock/${item.productId}?clearCache=true`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            if (cacheClearResponse.ok) {
              console.log(
                `✅ Final cache clear successful for product ${item.productId}`
              );
            } else {
              console.warn(
                `⚠️ Final cache clear failed for product ${item.productId}`
              );
            }
          } catch (error) {
            console.warn(
              `⚠️ Error during final cache clear for product ${item.productId}:`,
              error
            );
          }
        });

        await Promise.all(cacheClearPromises);
      }
    }

    // Handle order cancellation
    if (status === "canceled" && previousStatus !== "canceled") {
      // Step 1: Release reservations for each item in the order
      if (order.items && order.items.length > 0) {
        const reservationReleasePromises = order.items.map(
          async (item: OrderItem) => {
            try {
              // Release the reservation using the release endpoint
              const baseUrl =
                process.env.BASE_URL ||
                process.env.NEXT_PUBLIC_BASE_URL ||
                "http://localhost:3000";
              const releaseResponse = await fetch(
                `${baseUrl}/api/products/release/${item.productId}`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    sessionId: order.sessionId,
                    quantity: item.quantity,
                  }),
                }
              );

              if (!releaseResponse.ok) {
                console.warn(
                  `⚠️ Failed to release reservation for product ${item.productId}: ${await releaseResponse.text()}`
                );
              }

              return { success: releaseResponse.ok };
            } catch (error) {
              console.error(
                `❌ Error releasing reservation for product ${item.productId}:`,
                error
              );
              return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
              };
            }
          }
        );

        await Promise.all(reservationReleasePromises);
        console.log(
          `✅ All reservation releases completed for order ${orderId}`
        );
      }

      // Step 2: Wait a moment to ensure reservation releases are processed
      console.log(`⏳ Waiting for reservation releases to settle...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 3: Consolidated cleanup - replaces multiple API calls
      if (order.items && order.items.length > 0) {
        console.log(
          `🧹 Starting consolidated cleanup for canceled order ${orderId}`
        );

        const cleanupResult = await cleanupOrderReservations({
          orderId,
          sessionId: order.sessionId,
        });

        if (cleanupResult.success) {
          console.log(
            `✅ Order cleanup completed successfully:`,
            cleanupResult.message
          );
        } else {
          console.warn(
            `⚠️ Order cleanup completed with errors:`,
            cleanupResult.message
          );
          if (cleanupResult.errors && cleanupResult.errors.length > 0) {
            cleanupResult.errors.forEach((error) =>
              console.warn(`   - Error: ${error}`)
            );
          }
        }
      }

      // Step 4: Final cache invalidation to ensure fresh data
      console.log(
        `🔄 Performing final cache invalidation for canceled order...`
      );
      if (order.items && order.items.length > 0) {
        const cacheClearPromises = order.items.map(async (item: OrderItem) => {
          try {
            const baseUrl =
              process.env.BASE_URL ||
              process.env.NEXT_PUBLIC_BASE_URL ||
              "http://localhost:3000";
            const cacheClearResponse = await fetch(
              `${baseUrl}/api/products/stock/${item.productId}?clearCache=true`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            if (cacheClearResponse.ok) {
              console.log(
                `✅ Final cache clear successful for product ${item.productId}`
              );
            } else {
              console.warn(
                `⚠️ Final cache clear failed for product ${item.productId}`
              );
            }
          } catch (error) {
            console.warn(
              `⚠️ Error during final cache clear for product ${item.productId}:`,
              error
            );
          }
        });

        await Promise.all(cacheClearPromises);
        console.log(
          `✅ Final cache invalidation completed for canceled order ${orderId}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully",
      orderId,
      previousStatus,
      newStatus: status,
    });
  } catch (error) {
    console.error(`Order update error for order ${orderId}:`, error);
    return NextResponse.json(
      {
        error: "Failed to update order status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
