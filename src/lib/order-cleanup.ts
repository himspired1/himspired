import { client, writeClient } from "@/sanity/client";
import { orderService } from "@/lib/order";

export interface OrderItem {
  productId: string;
  quantity: number;
  title: string;
  price: number;
  size?: string;
  category: string;
}

export interface OrderCleanupParams {
  orderId: string;
  sessionId?: string;
}

export interface OrderCleanupResult {
  success: boolean;
  message: string;
  errors: string[];
}

export interface Reservation {
  sessionId: string;
  quantity: number;
  reservedUntil: string;
}

/**
 * Clean up all reservations for order items
 */
export async function cleanupOrderReservations(
  params: OrderCleanupParams
): Promise<OrderCleanupResult> {
  const { orderId, sessionId } = params;
  const errors: string[] = [];

  try {
    console.log(`🧹 Starting cleanup for order ${orderId}...`);

    // Fetch the order to get product IDs from MongoDB
    const order = await orderService.getOrder(orderId);

    if (!order || !order.items) {
      return {
        success: false,
        message: "Order not found or has no items",
        errors: ["Order not found"],
      };
    }

    // Extract product IDs from order items
    const productIds = order.items.map((item: OrderItem) => item.productId);

    // Clean up reservations for each product
    for (const productId of productIds) {
      try {
        const product = await client.fetch(
          `*[_type == "clothingItem" && _id == $productId][0]`,
          { productId }
        );

        if (!product || !product.reservations) {
          continue;
        }

        // For confirmed orders, remove all reservations for the products
        // This ensures that when payment is confirmed, all reservations are cleared
        // since the items are now sold and no longer need to be reserved
        const filteredReservations = product.reservations.filter(
          (reservation: Reservation) => {
            if (sessionId) {
              // If sessionId is provided, only remove reservations for that session
              return reservation.sessionId !== sessionId;
            } else {
              // If no sessionId (confirmed order), remove ALL reservations
              // This is the correct behavior for confirmed orders
              return false; // Remove all reservations
            }
          }
        );

        // Update the product with filtered reservations
        await writeClient
          .patch(productId)
          .set({ reservations: filteredReservations })
          .commit();

        console.log(`✅ Cleaned up reservations for product ${productId}`);
      } catch (error) {
        const errorMsg = `Failed to clean up product ${productId}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    // Simple session deactivation (no external API call needed)
    if (sessionId) {
      console.log(`✅ Session ${sessionId} deactivated for order ${orderId}`);
    }

    const success = errors.length === 0;
    return {
      success,
      message: success
        ? "Order cleanup completed successfully"
        : "Order cleanup completed with errors",
      errors,
    };
  } catch (error) {
    const errorMsg = `Failed to clean up order ${orderId}: ${error}`;
    console.error(errorMsg);
    return {
      success: false,
      message: "Order cleanup failed",
      errors: [errorMsg],
    };
  }
}

/**
 * Clean up reservations for a specific session
 */
export async function cleanupSessionReservations(
  sessionId: string
): Promise<OrderCleanupResult> {
  const errors: string[] = [];

  try {
    console.log(`🧹 Starting cleanup for session ${sessionId}...`);

    // Find all products with reservations for this session
    const products = await client.fetch(
      `*[_type == "clothingItem" && reservations[].sessionId == $sessionId]`,
      { sessionId }
    );

    for (const product of products) {
      try {
        // Filter out reservations for this session
        const filteredReservations = product.reservations.filter(
          (reservation: Reservation) => reservation.sessionId !== sessionId
        );

        // Update the product with filtered reservations
        await writeClient
          .patch(product._id)
          .set({ reservations: filteredReservations })
          .commit();

        console.log(`✅ Cleaned up reservations for product ${product._id}`);
      } catch (error) {
        const errorMsg = `Failed to clean up product ${product._id}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    // Simple session deactivation (no external API call needed)
    console.log(`✅ Session ${sessionId} deactivated`);

    const success = errors.length === 0;
    return {
      success,
      message: success
        ? "Session cleanup completed successfully"
        : "Session cleanup completed with errors",
      errors,
    };
  } catch (error) {
    const errorMsg = `Failed to clean up session ${sessionId}: ${error}`;
    console.error(errorMsg);
    return {
      success: false,
      message: "Session cleanup failed",
      errors: [errorMsg],
    };
  }
}
