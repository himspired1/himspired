import { SessionManager } from "./session";
import { CACHE_KEYS } from "./cache-constants";

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
    await this.performSessionCleanup({
      startMessage: "🔄 Starting payment confirmation cleanup...",
      completionMessage: "✅ Payment confirmation cleanup completed",
      errorMessage: "❌ Error during payment confirmation cleanup:",
    });
  }

  /**
   * Clear session only (without page refresh)
   * Use this when you want to clear session without reloading the page
   */
  static clearSessionOnly(): void {
    this.performSessionCleanup({
      startMessage: "🔄 Clearing session only...",
      completionMessage: "✅ Session-only cleanup completed",
      errorMessage: "❌ Error during session-only cleanup:",
    });
  }

  /**
   * Private helper method to perform session cleanup with custom logging
   */
  private static async performSessionCleanup(options: {
    startMessage: string;
    completionMessage: string;
    errorMessage: string;
  }): Promise<void> {
    try {
      console.log(options.startMessage);

      // Clear the session to remove any lingering reservation data
      SessionManager.clearSession();
      console.log("✅ Session cleared");

      // Generate a new session ID
      const newSessionId = SessionManager.getSessionId();
      console.log("✅ New session created:", newSessionId);

      // Clear any cached stock data
      this.clearStockCache();

      console.log(options.completionMessage);
    } catch (error) {
      console.error(options.errorMessage, error);
    }
  }

  /**
   * Clear any cached stock data using namespace prefix
   * Only clears keys that start with the specified namespace to avoid conflicts
   */
  private static clearStockCache(): void {
    try {
      // Clear localStorage cache using namespace prefix
      const cacheKeys = Object.keys(localStorage).filter(
        (key) => key.startsWith(CACHE_KEYS.NAMESPACE) && 
        (key.includes("stock") || key.includes("reservation") || key.includes("cart"))
      );

      cacheKeys.forEach((key) => {
        localStorage.removeItem(key);
      });

      console.log(`✅ Cleared ${cacheKeys.length} cached items with namespace "${CACHE_KEYS.NAMESPACE}"`);
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
