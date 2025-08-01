import { NextRequest, NextResponse } from "next/server";
import { AdminAuth } from "@/lib/admin-auth";
import { decrementStockForOrder } from "@/lib/stock-update-utils";
import { cleanupOrderReservations } from "@/lib/order-cleanup";
import { orderService } from "@/lib/order";
import { cacheService } from "@/lib/cache-service";

// Simple rate limiting for order retrieval
const orderRetrievalAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_RETRIEVAL_ATTEMPTS = 20;
const WINDOW_MS = 60 * 1000; // 1 minute

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

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
    // Simple rate limiting
    const clientIp = getClientIp(req);
    const now = Date.now();
    let entry = orderRetrievalAttempts.get(clientIp);
    
    if (!entry || now - entry.firstAttempt > WINDOW_MS) {
      entry = { count: 0, firstAttempt: now };
    }
    
    entry.count++;
    orderRetrievalAttempts.set(clientIp, entry);
    
    if (entry.count > MAX_RETRIEVAL_ATTEMPTS) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: "Too many order retrieval attempts. Please try again later.",
        },
        { status: 429 }
      );
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
    // Simple rate limiting for order updates
    const clientIp = getClientIp(req);
    const now = Date.now();
    let entry = orderRetrievalAttempts.get(clientIp);
    
    if (!entry || now - entry.firstAttempt > WINDOW_MS) {
      entry = { count: 0, firstAttempt: now };
    }
    
    entry.count++;
    orderRetrievalAttempts.set(clientIp, entry);
    
    if (entry.count > 10) { // Lower limit for updates
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: "Too many order update attempts. Please try again later.",
        },
        { status: 429 }
      );
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

    // Clear order cache after status update
    try {
      await cacheService.clearOrderCache(orderId);
    } catch (error) {
      console.warn("Failed to clear order cache:", error);
    }

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

      // Step 2: Consolidated cleanup - replaces multiple API calls
      // Note: No artificial delay needed - stock updates are already complete
      // and cleanup will handle its own cache invalidation
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
    }

    // Handle order cancellation
    if (status === "canceled" && previousStatus !== "canceled") {
      // Consolidated cleanup - handles reservation release and cache invalidation
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
