import { PaymentCleanup } from "./payment-cleanup";

/**
 * Order Status Checker
 *
 * Monitors order status and triggers cleanup when payment is confirmed
 */
export class OrderStatusChecker {
  private static checkInterval: NodeJS.Timeout | null = null;
  private static orderIds: Set<string> = new Set();

  /**
   * Start monitoring an order for payment confirmation
   * @param orderId - The order ID to monitor
   */
  static startMonitoring(orderId: string): void {
    this.orderIds.add(orderId);

    // Start polling if not already started
    if (!this.checkInterval) {
      this.checkInterval = setInterval(() => {
        this.checkAllOrders();
      }, 30000); // Check every 30 seconds
    }

    console.log(`🔍 Started monitoring order: ${orderId}`);
  }

  /**
   * Stop monitoring an order
   * @param orderId - The order ID to stop monitoring
   */
  static stopMonitoring(orderId: string): void {
    this.orderIds.delete(orderId);

    // Stop polling if no orders are being monitored
    if (this.orderIds.size === 0 && this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log("🛑 Stopped order monitoring");
    }
  }

  /**
   * Check all monitored orders for payment confirmation
   */
  private static async checkAllOrders(): Promise<void> {
    for (const orderId of this.orderIds) {
      try {
        const response = await fetch(`/api/orders/${orderId}`);

        if (response.ok) {
          const order = await response.json();

          if (order.status === "payment_confirmed") {
            console.log(`✅ Payment confirmed for order: ${orderId}`);

            // Trigger cleanup only when payment is confirmed
            await PaymentCleanup.handlePaymentConfirmation();

            // Stop monitoring this order
            this.stopMonitoring(orderId);
          }
        }
      } catch (error) {
        console.error(`Error checking order ${orderId}:`, error);
      }
    }
  }

  /**
   * Manually trigger cleanup (for testing or immediate use)
   */
  static async triggerCleanup(): Promise<void> {
    console.log("🔧 Manually triggering cleanup...");
    await PaymentCleanup.handlePaymentConfirmation();
  }

  /**
   * Force cleanup all reservations for a specific product
   * This is used when reservations are stuck in Sanity
   */
  static async forceCleanupProduct(productId: string): Promise<void> {
    try {
      // Extract base product ID from order product ID (remove size and timestamp metadata)
      const baseProductId = productId.split(":::")[0];


      const response = await fetch(
        `/api/products/force-cleanup/${baseProductId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.STOCK_MODIFICATION_TOKEN || "admin-stock-token"}`,
          },
          body: JSON.stringify({
            clearAll: true, // Clear all reservations
          }),
        }
      );

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

      const cleanupPromises = orderItems.map(async (item) => {
        try {
          // Extract base product ID from order product ID (remove size and timestamp metadata)
          const baseProductId = item.productId.split(":::")[0];
          
          const response = await fetch(`/api/products/force-cleanup/${baseProductId}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.STOCK_MODIFICATION_TOKEN || "admin-stock-token"}`,
            },
            body: JSON.stringify({
              clearAll: true, // Clear all reservations
            }),
          });

          if (response.ok) {
            const result = await response.json();
            console.log(
              `✅ Force cleanup completed for ${item.title}:`,
              result
            );
            return {
              success: true,
              productId: item.productId,
              title: item.title,
            };
          } else {
            console.error(
              `❌ Force cleanup failed for ${item.title}:`,
              await response.text()
            );
            return {
              success: false,
              productId: item.productId,
              title: item.title,
            };
          }
        } catch (error) {
          console.error(
            `❌ Error during force cleanup for ${item.title}:`,
            error
          );
          return {
            success: false,
            productId: item.productId,
            title: item.title,
          };
        }
      });

      const results = await Promise.all(cleanupPromises);
      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      console.log(
        `✅ Force cleanup summary: ${successful} successful, ${failed} failed`
      );
    } catch (error) {
      console.error(`❌ Error during force cleanup order:`, error);
    }
  }

  /**
   * Get current monitoring status
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
