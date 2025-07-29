import { SessionManager } from "./session";

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

export class CheckoutSessionManager {
  /**
   * Start a checkout session for the current user
   * @param cartItems - The items in the user's cart
   * @returns Promise<boolean> - True if session started successfully
   */
  static async startCheckoutSession(cartItems: CartItem[]): Promise<boolean> {
    try {
      const sessionId = SessionManager.getSessionId();

      const response = await fetch("/api/checkout/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          cartItems,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Checkout session started:", result);
        return true;
      } else {
        console.error(
          "Failed to start checkout session:",
          await response.text()
        );
        return false;
      }
    } catch (error) {
      console.error("Error starting checkout session:", error);
      return false;
    }
  }

  /**
   * End the current checkout session
   * @returns Promise<boolean> - True if session ended successfully
   */
  static async endCheckoutSession(): Promise<boolean> {
    try {
      const sessionId = SessionManager.getSessionId();

      const response = await fetch("/api/checkout/session", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
        }),
      });

      if (response.ok) {
        console.log("Checkout session ended successfully");
        return true;
      } else {
        console.error("Failed to end checkout session:", await response.text());
        return false;
      }
    } catch (error) {
      console.error("Error ending checkout session:", error);
      return false;
    }
  }

  /**
   * Check if the current user has an active checkout session
   * @returns Promise<boolean> - True if user has active checkout session
   */
  static async hasActiveCheckoutSession(): Promise<boolean> {
    try {
      const sessionId = SessionManager.getSessionId();

      const response = await fetch(`/api/checkout/session/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error("Error checking checkout session:", error);
      return false;
    }
  }

  /**
   * Convert cart items to the format expected by the checkout session
   * @param cartItems - The cart items from Redux state
   * @returns CartItem[] - Formatted cart items
   */
  static formatCartItemsForCheckout(cartItems: unknown[]): CartItem[] {
    return (cartItems as unknown[]).map((itemRaw) => {
      const item = itemRaw as {
        originalProductId?: string;
        _id?: string;
        quantity: number;
        price?: number;
      };
      return {
        productId: item.originalProductId || item._id || "",
        quantity: item.quantity,
        price: item.price ?? 0,
      };
    });
  }
}
