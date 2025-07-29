import { SessionManager } from "./session";

/**
 * Payment Cleanup Utility
 *
 * Handles cleanup tasks when payment is confirmed:
 * - Clear user session to remove reservation data
 * - Refresh stock data
 * - Update UI state
 */
export class PaymentCleanup {
  /**
   * Clear session and refresh data after payment confirmation
   * This should be called when payment is confirmed to clean up the frontend state
   */
  static async handlePaymentConfirmation(): Promise<void> {
    try {
      console.log("🔄 Starting payment confirmation cleanup...");

      // Clear the session to remove any lingering reservation data
      SessionManager.clearSession();
      console.log("✅ Session cleared");

      // Generate a new session ID
      const newSessionId = SessionManager.getSessionId();
      console.log("✅ New session created:", newSessionId);

      // Clear any cached stock data
      this.clearStockCache();

      // Don't automatically refresh the page - let the component handle updates
      console.log("✅ Payment confirmation cleanup completed");
    } catch (error) {
      console.error("❌ Error during payment confirmation cleanup:", error);
    }
  }

  /**
   * Clear session only (without page refresh)
   * Use this when you want to clear session without reloading the page
   */
  static clearSessionOnly(): void {
    try {
      console.log("🔄 Clearing session only...");

      // Clear the session to remove any lingering reservation data
      SessionManager.clearSession();
      console.log("✅ Session cleared");

      // Generate a new session ID
      const newSessionId = SessionManager.getSessionId();
      console.log("✅ New session created:", newSessionId);

      // Clear any cached stock data
      this.clearStockCache();

      console.log("✅ Session-only cleanup completed");
    } catch (error) {
      console.error("❌ Error during session-only cleanup:", error);
    }
  }

  /**
   * Clear any cached stock data
   */
  private static clearStockCache(): void {
    try {
      // Clear localStorage cache if any
      const cacheKeys = Object.keys(localStorage).filter(
        (key) => key.includes("stock") || key.includes("reservation")
      );

      cacheKeys.forEach((key) => {
        localStorage.removeItem(key);
      });

      console.log(`✅ Cleared ${cacheKeys.length} cached items`);
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  }

  /**
   * Refresh the page to update all stock displays
   */
  private static refreshPage(): void {
    try {
      // Use a small delay to ensure cleanup is complete
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error refreshing page:", error);
    }
  }

  /**
   * Check if payment confirmation cleanup is needed
   * This can be called periodically to detect payment confirmation
   */
  static async checkPaymentStatus(): Promise<void> {
    try {
      // This could be enhanced to check with the server
      // For now, we'll rely on manual triggers
      console.log("🔍 Checking payment status...");
    } catch (error) {
      console.error("Error checking payment status:", error);
    }
  }
}
