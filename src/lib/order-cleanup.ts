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

        if (!product) {
          console.warn(`⚠️ Product ${productId} not found in Sanity`);
          continue;
        }

        if (!product.reservations || product.reservations.length === 0) {
          continue;
        }

        // For confirmed orders, remove only the reservations for this specific order's session
        // This ensures that when payment is confirmed, only the confirmed order's reservations are cleared
        // while other users' reservations remain intact
        const filteredReservations = product.reservations.filter(
          (reservation: Reservation) => {
            if (sessionId) {
              // If sessionId is provided, only remove reservations for that session
              const shouldKeep = reservation.sessionId !== sessionId;
              return shouldKeep;
            } else {
              // If no sessionId, we need to be more aggressive for confirmed orders
              // Since this is a confirmed order, we should remove all reservations
              // This is a fallback for orders created before sessionId was properly tracked
              return false; // Remove all reservations for confirmed orders without sessionId
            }
          }
        );

        // Update the product with filtered reservations
        await writeClient
          .patch(productId)
          .set({ reservations: filteredReservations })
          .commit();

        // Clear stock cache for this product to ensure fresh data
        try {
          const baseUrl =
            process.env.BASE_URL ||
            process.env.NEXT_PUBLIC_BASE_URL ||
            "http://localhost:3000";
          const cacheClearResponse = await fetch(
            `${baseUrl}/api/products/stock/${productId}?clearCache=true`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (cacheClearResponse.ok) {
    
          } else {
            console.warn(
              `⚠️ Failed to clear stock cache for product ${productId}`
            );
          }
        } catch (cacheError) {
          console.warn(
            `⚠️ Error clearing stock cache for product ${productId}:`,
            cacheError
          );
        }
      } catch (error) {
        const errorMsg = `Failed to clean up product ${productId}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    // Simple session deactivation (no external API call needed)
    if (sessionId) {
  
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
