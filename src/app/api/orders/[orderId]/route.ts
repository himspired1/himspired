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

    console.log(`🔍 Looking for order: ${orderId}`);

    // Get order details using the order service (MongoDB)
    let order = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (!order && attempts < maxAttempts) {
      attempts++;
      console.log(`🔍 Attempt ${attempts} to find order ${orderId}`);

      try {
        order = await orderService.getOrder(orderId);
      } catch (error) {
        console.log(`❌ Error on attempt ${attempts}:`, error);
      }

      if (!order && attempts < maxAttempts) {
        console.log(
          `⏳ Order not found on attempt ${attempts}, waiting 1 second...`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (!order) {
      console.log(
        `❌ Order ${orderId} not found after ${maxAttempts} attempts`
      );
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    console.log(`✅ Order ${orderId} found successfully`);
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

    console.log(
      `✅ Order ${orderId} status updated: ${previousStatus} -> ${status}`
    );

    // Handle payment confirmation
    if (
      status === "payment_confirmed" &&
      previousStatus !== "payment_confirmed"
    ) {
      console.log(
        `💰 Payment confirmed for order ${orderId}, processing stock updates and cleanup...`
      );

      // Step 1: Decrement stock for each item in the order
      if (order.items && order.items.length > 0) {
        const stockUpdatePromises = order.items.map(async (item: OrderItem) => {
          try {
            const result = await decrementStockForOrder({
              productId: item.productId,
              quantity: item.quantity,
              orderId: orderId,
            });

            if (result.success) {
              console.log(
                `✅ Stock decremented for product ${item.productId}: ${result.previousStock} -> ${result.newStock}`
              );
            } else {
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

      // Step 2: Consolidated cleanup - replaces multiple API calls
      if (order.items && order.items.length > 0) {
        console.log(`🧹 Starting consolidated cleanup for order ${orderId}`);

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
