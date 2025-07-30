/**
 * Order Status Checker
 *
 * Monitors order status and triggers cleanup when payment is confirmed
 */
import { Order, OrderItem } from "@/models/order";

export class OrderStatusChecker {
  private static checkInterval: NodeJS.Timeout | null = null;
  private static orderIds: Set<string> = new Set();

  /**
   * Start monitoring an order for status changes
   * This will periodically check the order status and trigger cleanup if needed
   */
  static startMonitoring(orderId: string): void {
    if (this.orderIds.has(orderId)) {
      console.log(`Order ${orderId} is already being monitored`);
      return;
    }

    this.orderIds.add(orderId);
    console.log(`Started monitoring order ${orderId}`);

    // Start the monitoring interval if it's not already running
    if (!this.checkInterval) {
      this.checkInterval = setInterval(() => {
        this.checkAllOrders();
      }, 30000); // Check every 30 seconds
      console.log("Order status monitoring started");
    }
  }

  /**
   * Stop monitoring an order
   */
  static stopMonitoring(orderId: string): void {
    if (this.orderIds.delete(orderId)) {
      console.log(`Stopped monitoring order ${orderId}`);
    }

    // Stop the interval if no orders are being monitored
    if (this.orderIds.size === 0 && this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log("Order status monitoring stopped");
    }
  }

  /**
   * Check all monitored orders for status changes
   */
  private static async checkAllOrders(): Promise<void> {
    for (const orderId of this.orderIds) {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (!response.ok) {
          console.log(`Order ${orderId} not found, removing from monitoring`);
          this.orderIds.delete(orderId);
          continue;
        }

        const order: Order = await response.json();

        // Check if order is in a final state (complete, canceled, etc.)
        if (order.status === "complete" || order.status === "canceled") {
          console.log(`Order ${orderId} is in final state, triggering cleanup`);
          await this.cleanupSpecificOrder(orderId);
          this.orderIds.delete(orderId);
        }
      } catch (error) {
        console.error(`Error checking order ${orderId}:`, error);
      }
    }
  }

  /**
   * Trigger cleanup for all monitored orders
   */
  static async triggerCleanup(): Promise<void> {
    try {
      console.log("🔧 Triggering cleanup for all monitored orders...");

      const cleanupPromises = Array.from(this.orderIds).map(async (orderId) => {
        try {
          const response = await fetch(`/api/orders/${orderId}`);
          if (!response.ok) {
            return null;
          }

          const order: Order = await response.json();
          if (!order || !order.items) {
            return null;
          }

          // Extract product IDs from order items
          const productIds = order.items.map(
            (item: OrderItem) => item.productId
          );

          // Call the new server-side API route
          const cleanupResponse = await fetch("/api/admin/force-cleanup", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              productIds: productIds,
              clearAll: true,
            }),
          });

          if (cleanupResponse.ok) {
            const result = await cleanupResponse.json();
            console.log(`✅ Cleanup completed for order ${orderId}:`, result);
            return {
              success: true,
              orderId: orderId,
              result: result,
            };
          } else {
            const errorText = await cleanupResponse.text();
            console.error(`❌ Cleanup failed for order ${orderId}:`, errorText);
            return {
              success: false,
              orderId: orderId,
              error: errorText,
            };
          }
        } catch (error) {
          console.error(`❌ Error during cleanup for order ${orderId}:`, error);
          return {
            success: false,
            orderId: orderId,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      });

      const results = await Promise.all(cleanupPromises);
      const successful = results.filter((r) => r && r.success).length;
      const failed = results.filter((r) => r && !r.success).length;

      console.log(
        `🔧 Cleanup summary: ${successful} successful, ${failed} failed`
      );
    } catch (error) {
      console.error("❌ Error during cleanup trigger:", error);
    }
  }

  /**
   * Cleanup for a specific order only
   * This method handles cleanup for a single order that has reached a final state
   */
  static async cleanupSpecificOrder(orderId: string): Promise<void> {
    try {
      console.log(`🔧 Triggering cleanup for specific order ${orderId}...`);

      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) {
        console.warn(`⚠️ Order ${orderId} not found during cleanup`);
        return;
      }

      const order: Order = await response.json();
      if (!order || !order.items) {
        console.warn(`⚠️ Order ${orderId} has no items for cleanup`);
        return;
      }

      // Extract product IDs from order items
      const productIds = order.items.map((item: OrderItem) => item.productId);

      // Call the server-side API route for cleanup
      const cleanupResponse = await fetch("/api/admin/force-cleanup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productIds: productIds,
          clearAll: true,
        }),
      });

      if (cleanupResponse.ok) {
        const result = await cleanupResponse.json();
        console.log(`✅ Cleanup completed for order ${orderId}:`, result);
      } else {
        const errorText = await cleanupResponse.text();
        console.error(`❌ Cleanup failed for order ${orderId}:`, errorText);
      }
    } catch (error) {
      console.error(`❌ Error during cleanup for order ${orderId}:`, error);
    }
  }

  /**
   * Force cleanup all reservations for a specific product
   * This is used when reservations are stuck in Sanity
   */
  static async forceCleanupProduct(productId: string): Promise<void> {
    try {
      // Call the new server-side API route
      const response = await fetch("/api/admin/force-cleanup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productIds: [productId],
          clearAll: true,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Force cleanup completed:`, result);
      } else {
        console.error(`❌ Force cleanup failed:`, await response.text());
      }
    } catch (error) {
      console.error(`❌ Error during force cleanup:`, error);
    }
  }

  /**
   * Force cleanup all reservations for all products in an order
   * This is used when reservations are stuck in Sanity for multiple products
   */
  static async forceCleanupOrder(
    orderItems: Array<{ productId: string; title: string }>
  ): Promise<void> {
    try {
      console.log(
        `🔧 Force cleaning up reservations for ${orderItems.length} products...`
      );

      // Extract product IDs from order items
      const productIds = orderItems.map((item) => item.productId);

      // Call the new server-side API route
      const response = await fetch("/api/admin/force-cleanup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productIds: productIds,
          clearAll: true,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Force cleanup completed:`, result);
      } else {
        console.error(`❌ Force cleanup failed:`, await response.text());
      }
    } catch (error) {
      console.error(`❌ Error during force cleanup:`, error);
    }
  }

  /**
   * Get the current monitoring status
   */
  static getMonitoringStatus(): {
    isMonitoring: boolean;
    orderCount: number;
    orderIds: string[];
  } {
    return {
      isMonitoring: this.checkInterval !== null,
      orderCount: this.orderIds.size,
      orderIds: Array.from(this.orderIds),
    };
  }
}
